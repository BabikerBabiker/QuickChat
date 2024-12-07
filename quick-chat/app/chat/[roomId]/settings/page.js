"use client";
import Navbar from "@/app/components/Navbar";
import {
  Avatar,
  Box,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { auth, db } from "../../../../lib/firebase";

export default function RoomSettings({ params: paramsPromise }) {
  const [room, setRoom] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [newUser, setNewUser] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  const [usernames, setUsernames] = useState([]);
  const router = useRouter();
  const params = React.use(paramsPromise);
  const { roomId } = params || {};

  useEffect(() => {
    if (!roomId) return;

    const fetchRoomDetails = async () => {
      try {
        const roomDoc = await getDoc(doc(db, "chatRooms", roomId));
        if (roomDoc.exists()) {
          const roomData = roomDoc.data();
          setRoom(roomData);
          setRoomName(roomData.name || "Untitled Room");
          setIsPrivate(roomData.isPrivate);
          setAllowedUsers(roomData.allowedUsers || []);
          if (roomData.createdBy === auth.currentUser?.uid) {
            setIsCreator(true);
          } else {
            setIsCreator(false);
          }
        } else {
          console.error("Room not found in Firestore");
          router.push("/not-authorized");
        }
      } catch (error) {
        console.error("Error fetching room:", error);
      }
    };

    fetchRoomDetails();
  }, [roomId, router]);

  useEffect(() => {
    const fetchUsernames = async () => {
      const userList = [];
      const userIds = allowedUsers;
      if (userIds.length === 0) return;

      for (const userId of userIds) {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userList.push({ id: userId, username: userData.username });
        }
      }

      setUsernames(userList);
    };

    fetchUsernames();
  }, [allowedUsers]);

  const handleRoomNameChange = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    try {
      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, { name: roomName });
    } catch (error) {
      console.error("Error updating room name:", error);
    }
  };

  const handlePrivacyChange = async () => {
    try {
      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, { isPrivate: !isPrivate });
      setIsPrivate((prev) => !prev);
    } catch (error) {
      console.error("Error updating room privacy:", error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.trim()) return;

    try {
      const usersQuery = query(
        collection(db, "users"),
        where("username", "==", newUser)
      );

      const querySnapshot = await getDocs(usersQuery);

      if (querySnapshot.empty) {
        console.error("User not found");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;

      if (allowedUsers.includes(userId)) {
        console.log("User already in the room");
        return;
      }

      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, {
        allowedUsers: [...allowedUsers, userId],
      });

      setAllowedUsers((prev) => [...prev, userId]);
      setNewUser("");
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (userId === room.createdBy) {
      console.log("You cannot remove the room creator.");
      return;
    }

    try {
      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, {
        allowedUsers: allowedUsers.filter((id) => id !== userId),
      });

      setAllowedUsers((prev) => prev.filter((id) => id !== userId));
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  if (!room || !isCreator) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <p>Unauthorized!</p>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push(`/chat/${roomId}`)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: "600px",
          margin: "0 auto",
          mb: 4,
          mt: 10,
          padding: "20px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: 3,
          gap: 3,
          "@media (max-width: 600px)": {
            padding: "15px",
            width: "100%",
          },
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push(`/chat/${roomId}`)}
          sx={{ alignSelf: "flex-start", mb: 2 }}
        >
          Go Back
        </Button>
        <Typography variant="h4" sx={{ textAlign: "center", marginBottom: 3 }}>
          Room Settings
        </Typography>

        <form onSubmit={handleRoomNameChange} style={{ width: "100%" }}>
          <TextField
            label="Room Name"
            variant="outlined"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            fullWidth
            sx={{
              mb: 2,
              "& .MuiInputBase-root": {
                borderRadius: "8px",
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ padding: "12px" }}
          >
            Save Room Name
          </Button>
        </form>

        <FormControlLabel
          control={
            <Switch
              checked={isPrivate}
              onChange={handlePrivacyChange}
              name="privacy"
            />
          }
          label={isPrivate ? "Private Room" : "Public Room"}
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            width: "100%",
          }}
        />

        {isPrivate && (
          <>
            <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
              Allowed Users
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                width: "100%",
                gap: 2,
                mb: 3,
                overflowY: "auto",
                maxHeight: "300px",
              }}
            >
              {usernames.map((user) => (
                <Box
                  key={user.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "8px",
                    padding: "8px",
                    "@media (max-width: 600px)": {
                      flexDirection: "column",
                      alignItems: "flex-start",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      alt={user.username}
                      src={
                        user.profilePicture ||
                        "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg"
                      }
                      sx={{ marginRight: 2 }}
                    />
                    <Typography>{user.username}</Typography>
                  </Box>

                  {user.id !== room.createdBy && (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveUser(user.id)}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          </>
        )}

        <form
          onSubmit={handleAddUser}
          style={{ display: "flex", width: "100%" }}
        >
          <TextField
            label="Add User by Username"
            variant="outlined"
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            fullWidth
            sx={{ mr: 2 }}
          />
          <Button type="submit" variant="contained" color="primary">
            Add User
          </Button>
        </form>
      </Box>
    </>
  );
}
