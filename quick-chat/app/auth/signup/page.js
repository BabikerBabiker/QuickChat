"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Input,
  InputLabel,
  TextField,
  Typography,
} from "@mui/material";
import imageCompression from "browser-image-compression";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth, db } from "../../../lib/firebase";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validateUsername = (username) => {
    return username.length >= 5 && !/\s/.test(username);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!validateEmail(email)) {
        throw new Error("Please enter a valid email address.");
      }

      if (!validateUsername(username)) {
        throw new Error(
          "Username must be at least 5 characters and cannot contain spaces."
        );
      }

      const usernameRef = doc(db, "users", username);
      const usernameSnapshot = await getDoc(usernameRef);
      if (usernameSnapshot.exists()) {
        throw new Error("Username is already in use.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      let profilePictureBase64 = null;
      if (profilePicture) {
        if (profilePicture.size > 1 * 1024 * 1024) {
          const compressedImage = await imageCompression(profilePicture, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
          });
          profilePictureBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(compressedImage);
          });
        } else {
          profilePictureBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(profilePicture);
          });
        }
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: username,
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        username,
        email,
        profilePicture: profilePictureBase64,
      });

      router.push("/auth/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <Box sx={{ textAlign: "center", marginBottom: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create an Account
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSignup}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label="Username"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Email"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Confirm Password"
          variant="outlined"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
        />

        <Box sx={{ marginTop: 2 }}>
          <Typography variant="body1" sx={{ marginBottom: 0 }}>
            Profile Picture
          </Typography>
          <FormControl fullWidth>
            <InputLabel htmlFor="profile-picture-upload"></InputLabel>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="profile-picture-upload"
              sx={{ marginTop: 0 }}
            />
          </FormControl>
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ marginTop: 3 }}
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : "Sign Up"}
        </Button>

        {error && (
          <Alert severity="error" sx={{ marginTop: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      <Box sx={{ textAlign: "center", marginTop: 2 }}>
        <Typography variant="body1">
          Already have an account?{" "}
          <Button
            onClick={() => router.push("/auth/login")}
            sx={{ textDecoration: "underline", color: "primary.main" }}
          >
            Login
          </Button>
        </Typography>
      </Box>
    </Container>
  );
}
