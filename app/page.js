'use client'
import React, { useState, useEffect } from "react";
import { Box, Button, Modal, Stack, TextField, Typography, Card, CardContent, CardActions, IconButton } from "@mui/material";
import { firestore, storage } from "./firebase";
import { collection, query, doc, setDoc, deleteDoc, getDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState(""); 
  const [quantity, setQuantity] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemImage, setItemImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
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
    const { quantity ,image} = docSnap.data();
   
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1, image: image });
      }
    await updateInventory();
  };

  const deleteItem = async (item) =>{
    const docRef = doc(collection(firestore, 'inventory'), item);
    await deleteDoc(docRef);
    await updateInventory();
  }

  const addItem = async (item,quant, image) => {
    let imageUrl = null;
  
    if (imageFile) {
      imageUrl = await uploadImage(image);
    }
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && addPressed) {
      const { quantity, image } = docSnap.data();
      
      await setDoc(docRef, { quantity: parseInt(quantity) + parseInt(1), image: image });
    }
    else {
      await setDoc(docRef, { quantity: quant, image: imageUrl });
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
    setImageFile(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setItemImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (image) => {
    if (!imageFile) return null;

    const imageRef = ref(storage, `images/${Date.now()}_${Math.random().toString(36).substring(7)}`);
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);
    return imageUrl;
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearchTerm = item.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearchTerm;
  });

  return (
    <Box width='100vw' height='100vh' display='flex' flexDirection="column" justifyContent='center' alignItems='center' p={4} gap={2}
        style={{
          backgroundImage: `url(${"https://img.freepik.com/free-photo/high-angle-forklift-blue-background_23-2149853122.jpg?t=st=1723740510~exp=1723744110~hmac=acbc1b5ffe2004a28f0f1c40b1198f54b20d8ca8113a4e698245fc7dfae0283c&w=900"})`,
          backgroundSize: "cover",
        }}
    >
      <Modal open={open} onClose={handleClose}>
        <Box position="absolute" top="50%" left="50%" width={400} bgcolor="white" border="2px solid #000"
          boxShadow={24} p={4} display="flex" flexDirection="column" gap={3} sx={{ transform: "translate(-50%, -50%)" }}
        >
          <Typography variant="h6">Add Item</Typography>
          <Stack width="100%" direction="column" spacing={2}>
            <TextField
              variant="outlined" 
              fullWidth
              label="Item Name"
              value={itemName}
              onChange={(e) => { setItemName(e.target.value) }}
            />
            <TextField
              id="outlined-number"
              type="number"
              variant="outlined"
              fullWidth
              label="Quantity"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value) }}
              defaultValue={1}
            />
            <Button variant="contained" component="label">
              Upload Picture
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
          </Stack>
          {itemImage && (
            <Box mt={2}>
              <img src={itemImage} alt="Item" style={{ width: '100%' }} />
            </Box>
          )}
          <Button variant="contained" onClick={() => {
            addPressed = true;
            addItem(itemName, quantity, itemImage);
            setItemName('');
            handleClose();
          }}>Add</Button>
        </Box>
      </Modal>

      <Typography variant='h2' color="primary" >
        Inventory Management
      </Typography>
      <Stack direction='row' spacing={3} alignItems='center' mb={4}>
        <Button size='large' variant="contained" onClick={handleOpen}>Add New Item</Button>
        <TextField
          
          variant="outlined"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
         
        />

      </Stack>
      <Stack width="800px" height="300px" spacing={2} overflow={'auto'}>
        <Box width="100%" maxWidth="800px" mx="auto">
          {filteredInventory.map(({ name, quantity, image }) => (
            <Card key={name} variant="outlined">
              <CardContent>
                <Box display='flex' sx={{ justifyContent: 'space-between' }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h5" component="div">
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Typography>
                    {image && <img src={image} alt={name} style={{ width: '50px', height: '50px' }} />}
                  </Box>
                  <IconButton  onClick={() => {deleteItem(name)}}><DeleteIcon sx={{ color: 'red'}}/></IconButton>
                </Box> 
                <Typography variant="body2" color="text.secondary">
                  Quantity: {quantity}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" variant="contained" color="primary" onClick={() => { addItem(name, quantity, image); addPressed = true }}>Add</Button>
                <Button size="small" variant="contained" color="secondary" onClick={() => removeItem(name)}>Remove</Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
