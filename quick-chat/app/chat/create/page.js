"use client";

import Navbar from "@/app/components/Navbar";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth, db } from "../../../lib/firebase";

export default function CreateRoom() {
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const router = useRouter();

  const createRoom = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be logged in to create a room.");
      }

      const newRoomRef = await addDoc(collection(db, "chatRooms"), {
        name: roomName,
        createdAt: new Date(),
        isPrivate,
        allowedUsers: isPrivate ? [user.uid] : [],
        createdBy: user.uid,
      });

      router.push(`/chat/${newRoomRef.id}`);
    } catch (error) {
      console.error("Error creating chat room: ", error);
    }
  };

  return (
    <div>
      <Navbar />

      <Container
        sx={{ maxWidth: "sm", paddingTop: "3rem", paddingBottom: "2rem" }}
      >
        <Paper sx={{ padding: "2rem", borderRadius: "10px", boxShadow: 3 }}>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Create a New Chat Room
          </Typography>

          <Box sx={{ marginBottom: "2rem" }}>
            <TextField
              label="Room Name"
              variant="outlined"
              fullWidth
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              sx={{
                marginBottom: "1rem",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  padding: "12px",
                },
                "& .MuiInputLabel-root": {
                  fontWeight: 600,
                },
              }}
            />
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                color="primary"
              />
            }
            label="Make this room private"
            sx={{ marginBottom: "1.5rem" }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={createRoom}
            sx={{
              width: "100%",
              padding: "12px",
              fontWeight: 600,
              borderRadius: "50px",
              textTransform: "none",
              boxShadow: 3,
              "&:hover": {
                backgroundColor: "#1976d2",
                boxShadow: 6,
              },
            }}
          >
            Create Room
          </Button>
        </Paper>
      </Container>
    </div>
  );
}
