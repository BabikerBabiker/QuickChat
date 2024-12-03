"use client";

import ChatIcon from '@mui/icons-material/Chat';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Avatar, Box, Button, IconButton, Menu, MenuItem, Toolbar, Typography } from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";

export default function Navbar() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [open, setOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleSettings = () => {
    console.log("Settings button clicked");
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser);

        const fetchUserDetails = async () => {
          const userDoc = await getDoc(doc(db, "users", authUser.uid));
          if (userDoc.exists()) {
            setUserDetails(userDoc.data());
          } else {
            console.error("User document not found");
            setUserDetails(null);
          }
        };

        fetchUserDetails();
      } else {
        setUser(null);
        setUserDetails(null);
        router.push("/auth/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AppBar position="sticky" sx={{ background: 'linear-gradient(90deg, rgba(25,118,210,1) 0%, rgba(30,136,229,1) 100%)', boxShadow: 3 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={() => setOpen(!open)}
          sx={{ display: { xs: 'block', sm: 'none' }, color: '#fff' }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ChatIcon sx={{ color: '#fff', mr: 1 }} />
          <Typography variant="h6" sx={{ display: { xs: 'none', sm: 'block' }, color: '#fff', fontWeight: 600 }}>
            QuickChat
          </Typography>
        </Box>

        <Box sx={{ display: { xs: 'none', sm: 'flex' }, ml: 'auto' }}>
          <Button color="inherit" onClick={() => router.push("/chat")} sx={{ '&:hover': { backgroundColor: "#BBDEFB" }, color: "#fff", marginRight: "10px" }}>
            Rooms
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          {user && userDetails && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                alt={user.displayName || "User"}
                src={userDetails?.profilePicture || "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg"}
                onClick={handleMenuOpen}
                sx={{
                  cursor: "pointer",
                  marginRight: "10px",
                  border: "2px solid #fff",
                  transition: "all 0.3s ease",
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                  },
                }}
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                sx={{ marginTop: "15px", marginLeft: "-22px" }}
              >
                <MenuItem onClick={handleSettings}>Settings</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          )}
        </Box>

        {open && (
          <Box sx={{ display: { xs: 'block', sm: 'none' }, position: "absolute", top: "65px", right: "233px", backgroundColor: "white", boxShadow: 3 }}>
            <MenuItem sx={{ color: "black" }} onClick={() => router.push("/chat")}>Rooms</MenuItem>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}