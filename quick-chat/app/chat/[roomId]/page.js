"use client";

import Navbar from "@/app/components/Navbar";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { auth, db } from "../../../lib/firebase";

export default function Room({ params: paramsPromise }) {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsernames] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const router = useRouter();
  const params = React.use(paramsPromise);
  const { roomId } = params || {};

  useEffect(() => {
    if (!roomId) return;

    const fetchUserDetails = async (authUser) => {
      try {
        const userDoc = await getDoc(doc(db, "users", authUser.uid));
        if (userDoc.exists()) {
          setUserDetails(userDoc.data());
        } else {
          console.error("User details not found in Firestore");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    const fetchRoomDetails = async () => {
      try {
        const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
        if (roomDoc.exists()) {
          const roomData = roomDoc.data();
          if (
            roomData.isPrivate &&
            !roomData.allowedUsers.includes(auth.currentUser?.uid)
          ) {
            router.push("/not-authorized");
          } else {
            setRoom(roomData);
          }
        } else {
          console.error("Room not found in Firestore");
        }
      } catch (error) {
        console.error("Error fetching room:", error);
      }
    };

    const fetchMessages = () => {
      const messagesQuery = query(
        collection(db, "chatRooms", roomId, "messages"),
        orderBy("timestamp")
      );
      return onSnapshot(messagesQuery, (snapshot) => {
        setMessages(snapshot.docs.map((doc) => doc.data()));
      });
    };

    const fetchTypingStatus = () => {
      const typingQuery = doc(db, "chatRooms", roomId);
      return onSnapshot(typingQuery, async (docSnapshot) => {
        const typingStatus = docSnapshot.data()?.typing || {};
        const typingUserIds = Object.keys(typingStatus).filter(
          (userId) => typingStatus[userId] !== false
        );
        const usernames = await Promise.all(
          typingUserIds.map(async (userId) => {
            const userDoc = await getDoc(doc(db, "users", userId));
            return userDoc.exists() ? userDoc.data()?.username : null;
          })
        );
        setTypingUsernames(usernames.filter((username) => username !== null));
      });
    };

    const unsubscribeAuth = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await fetchUserDetails(authUser);
      } else {
        router.push("/auth/login");
        clearTypingStatus();
      }
    });

    const clearTypingStatus = async () => {
      try {
        const roomRef = doc(db, "chatRooms", roomId);
        await updateDoc(roomRef, {
          [`typing.${user.uid}`]: false,
        });
      } catch (error) {
        console.error("Error clearing typing status:", error);
      }
    };

    fetchRoomDetails();
    const unsubscribeMessages = fetchMessages();
    const unsubscribeTyping = fetchTypingStatus();

    return () => {
      unsubscribeAuth();
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [router, roomId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, "chatRooms", roomId, "messages"), {
        text: newMessage,
        uid: user.uid,
        displayName: userDetails?.username || "Anonymous",
        photoURL:
          userDetails?.profilePicture ||
          "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg",
        timestamp: new Date(),
      });
      setNewMessage("");
      setIsTyping(false);
      updateTypingStatus(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    } else {
      if (!isTyping) {
        setIsTyping(true);
        updateTypingStatus(true);
      }

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        setIsTyping(false);
        updateTypingStatus(false);
      }, 5000);
    }
  };

  let typingTimeout;

  const updateTypingStatus = async (isTyping) => {
    try {
      const roomRef = doc(db, "chatRooms", roomId);
      const username = userDetails?.username;
      if (isTyping && username) {
        await updateDoc(roomRef, {
          [`typing.${user.uid}`]: username,
        });
      } else {
        await updateDoc(roomRef, {
          [`typing.${user.uid}`]: false,
        });
      }
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const getTypingMessage = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    } else {
      return `${typingUsers.slice(0, 2).join(", ")} and others are typing...`;
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleInputResize = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      inputRef.current.style.resize = "none";
    }
  };

  if (!user || !userDetails) {
    return <p>Loading...</p>;
  }

  if (!room) {
    return <p>Room not found!</p>;
  }

  return (
    <>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
          backgroundColor: "#fff",
          borderRadius: "10px",
          padding: "16px",
          overflow: "hidden",
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push(`/chat`)}
          sx={{ alignSelf: "flex-start", mb: 2 }}
        >
          Go Back
        </Button>

        <Typography
          variant="h4"
          align="center"
          sx={{
            mb: 3,
            paddingTop: "20px",
            fontWeight: "bold",
            color: "#000",
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          {room.name}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "50vh",
            width: "100%",
            overflowY: "auto",
            backgroundColor: "#f5f5f5",
            borderRadius: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            position: "relative",
            paddingBottom: "40px",
          }}
        >
          {messages.map((msg, index) => {
            const currentTimestamp = msg.timestamp?.seconds
              ? new Date(msg.timestamp.seconds * 1000)
              : new Date(msg.timestamp);

            const previousTimestamp =
              index > 0
                ? messages[index - 1]?.timestamp?.seconds
                  ? new Date(messages[index - 1].timestamp.seconds * 1000)
                  : new Date(messages[index - 1].timestamp)
                : null;

            const shouldShowTimestamp =
              !previousTimestamp ||
              currentTimestamp - previousTimestamp > 60 * 60 * 1000;

            return (
              <React.Fragment key={index}>
                {shouldShowTimestamp && (
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: "center",
                      display: "block",
                      color: "#888",
                      margin: "10px 0",
                    }}
                  >
                    {currentTimestamp.toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })}
                  </Typography>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent:
                      msg.uid === user.uid ? "flex-end" : "flex-start",
                    mb: 0,
                    padding: "8px",
                  }}
                >
                  <Paper
                    elevation={3}
                    sx={{
                      padding: "12px 16px",
                      borderRadius: "16px",
                      backgroundColor:
                        msg.uid === user.uid ? "#DCF8C6" : "#FFFFFF",
                      maxWidth: "75%",
                      wordWrap: "break-word",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "break-word",
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        marginRight: "10px",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "40px",
                          height: "40px",
                        }}
                      >
                        <Image
                          src={msg.photoURL}
                          alt={msg.displayName}
                          fill
                          style={{
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {msg.displayName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#333" }}>
                        {msg.text}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              </React.Fragment>
            );
          })}

          {typingUsers.length > 0 && (
            <Box
              sx={{
                padding: "10px",
                fontSize: "14px",
                color: "#888",
                alignSelf: "center",
              }}
            >
              {getTypingMessage()}
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            display: "flex",
            alignItems: "center",
            padding: "8px",
            marginBottom: "0px",
            backgroundColor: "#fff",
            boxShadow: 3,
            width: "100%",
            marginTop: "20px",
          }}
        >
          <TextField
            ref={inputRef}
            label="Type a message..."
            variant="outlined"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            sx={{
              flexGrow: 1,
              marginRight: "12px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "0px",
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{
              borderRadius: "0px",
              height: "40px",
              width: "40px",
              minWidth: "unset",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ➤
          </Button>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push(`/chat/${roomId}/settings`)}
          sx={{ alignSelf: "flex-start", mt: "20px", mb: 2 }}
        >
          Settings
        </Button>
      </Box>
      
    </>
  );
}
