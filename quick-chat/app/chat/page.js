"use client"; // Client Component directive

import Navbar from "@/app/components/Navbar";
import { Alert, Button, CircularProgress, Container, List, ListItem, Typography } from "@mui/material";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser);
      } else {
        router.push("/auth/login");
      }
    });

    const fetchChatRooms = async () => {
      setLoading(true);
      try {
        const roomsSnapshot = await getDocs(collection(db, "chatRooms"));
        setChatRooms(roomsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <div>
      <Navbar />

      <Container sx={{ maxWidth: "md", paddingTop: "2rem", paddingBottom: "2rem" }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700 }}>
          Welcome to QuickChat
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push("/chat/create")}
          sx={{
            display: "block",
            marginBottom: "2rem",
            padding: "12px 20px",
            maxWidth: "250px",
            marginLeft: "auto",
            marginRight: "auto",
            borderRadius: "50px",
            fontWeight: 600,
            textTransform: "none",
            boxShadow: 3,
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "#1976d2",
              boxShadow: 6,
            },
          }}
        >
          Create New Room
        </Button>

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Available Chat Rooms
        </Typography>

        {chatRooms.length === 0 ? (
          <Alert severity="info" sx={{ marginBottom: "2rem" }}>
            No chat rooms available.
          </Alert>
        ) : (
          <List>
            {chatRooms.map((room) => (
              <ListItem
                key={room.id}
                sx={{
                  padding: "15px",
                  marginBottom: "1rem",
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  boxShadow: 3,
                  "&:hover": {
                    boxShadow: 6,
                  },
                  transition: "all 0.3s ease",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => router.push(`/chat/${room.id}`)}
                  sx={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px",
                    fontWeight: 600,
                    justifyContent: "flex-start",
                    borderRadius: "10px",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "#f1f1f1",
                      boxShadow: 3,
                    },
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {room.name}
                  </Typography>
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </Container>
    </div>
  );
}
