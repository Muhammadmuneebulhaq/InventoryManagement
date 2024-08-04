'use client'
import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Modal, Stack, TextField, Typography, Card, CardContent, CardActions } from "@mui/material";
import { firestore, storage } from "./firebase";
import { collection, query, doc, setDoc, deleteDoc, getDoc, getDocs } from "firebase/firestore";
import { Camera } from "react-camera-pro";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [openCamera, setOpenCamera] = useState(false);
  const [itemName, setItemName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");
  const [itemImage, setItemImage] = useState(null);
  const camera = useRef(null);
  let addPressed = false;

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const addItem = async (item, image) => {
    
    const imageUrl = await uploadImage(image);
   
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && addPressed) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1, image: imageUrl });
    } else if (!addPressed && docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity, image: imageUrl });
    } else {
      await setDoc(docRef, { quantity: 1, image: imageUrl });
    }
    await updateInventory();
    addPressed = false;
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setItemImage(null);
  };

  const handleOpenCamera = () => setOpenCamera(true);
  const handleCloseCamera = () => setOpenCamera(false);

  const takePicture = () => {
    const photo = camera.current.takePhoto();
    setItemImage(photo);
    handleCloseCamera();
  };

  const uploadImage = async (image) => {
    if (!image) return null;
    
    const response = await fetch(image);
    const blob = await response.blob();
    const imageRef = ref(storage, `images/${Date.now()}_${Math.random().toString(36).substring(7)}`);
    await uploadBytes(imageRef, blob);
    const imageUrl = await getDownloadURL(imageRef);
    return imageUrl;
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearchTerm = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuantity = (
      (minQuantity === "" || item.quantity >= parseInt(minQuantity)) &&
      (maxQuantity === "" || item.quantity <= parseInt(maxQuantity))
    );
    return matchesSearchTerm && matchesQuantity;
  });

  return (
    <Box width='100vw' height='100vh' display='flex' flexDirection="column" justifyContent='center' alignItems='center' p={4} gap={2}>
      <Modal open={open} onClose={handleClose}>
        <Box position="absolute" top="50%" left="50%" width={400} bgcolor="white" border="2px solid #000" 
          boxShadow={24} p={4} display="flex" flexDirection="column" gap={3} sx={{ transform: "translate(-50%, -50%)" }}
        >
          <Typography variant="h6">Add Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => { setItemName(e.target.value) }}
            />
            <Button variant="contained" onClick={handleOpenCamera}>Take Picture</Button>
          </Stack>
          {itemImage && (
            <Box mt={2}>
              <img src={itemImage} alt="Item" style={{ width: '100%' }} />
            </Box>
          )}
          <Button variant="contained" onClick={() => {
            addPressed = true;
            addItem(itemName, itemImage);
            setItemName('');
            handleClose();
          }}>Add</Button>
        </Box>
      </Modal>

      <Modal open={openCamera} onClose={handleCloseCamera}>
        <Box position="absolute" top="50%" left="50%" width={400} height={500} bgcolor="white" border="2px solid #000" 
          boxShadow={24} p={4} display="flex" flexDirection="column" gap={3} sx={{ transform: "translate(-50%, -50%)" }}
        >
          <Camera ref={camera} />
          <Button variant="contained" onClick={takePicture}>Take Picture</Button>
        </Box>
      </Modal>

      <Typography variant='h2' color="primary" >
        Inventory Management
      </Typography>
      <Stack direction='row' spacing={3} alignItems='center' mb={4}>
        <Button variant="contained" onClick={handleOpen}>Add New Item</Button>
        <TextField
          variant="outlined"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <TextField
          variant="outlined"
          placeholder="Min Quantity"
          value={minQuantity}
          onChange={(e) => setMinQuantity(e.target.value)}
          type="number"
        />
        <TextField
          variant="outlined"
          placeholder="Max Quantity"
          value={maxQuantity}
          onChange={(e) => setMaxQuantity(e.target.value)}
          type="number"
        />
      </Stack>
      <Stack width="800px" height="300px" spacing={2} overflow={'auto'}>
        <Box width="100%" maxWidth="800px" mx="auto">
          {filteredInventory.map(({ name, quantity, image }) => (
            <Card key={name} variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h5" component="div">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  {image && <img src={image} alt={name} style={{ width: '50px', height: '50px' }} />}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Quantity: {quantity}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" variant="contained" color="primary" onClick={() => {addItem(name, image); addPressed= true}}>Add</Button>
                <Button size="small" variant="contained" color="secondary" onClick={() => removeItem(name, image)}>Remove</Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
