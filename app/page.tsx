'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, orderBy, query, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from './lib/firebase';
import Camera from './components/Camera';
import Post from './components/Post';

interface Post {
  id: string;
  username: string;
  userImage: string;
  image: string;
  caption: string;
  timestamp: any;
  likes: number;
  smileScore: number;
}

export default function Home() {
  const [showCamera, setShowCamera] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to posts
    const unsubscribe = onSnapshot(
      query(collection(db, 'posts'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        setPosts(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as Post[]
        );
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCapture = async (image: string, smileScore: number) => {
    setLoading(true);
    try {
      // Compress image before uploading
      const img = new Image();
      img.src = image;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxWidth = 1080;
      const maxHeight = 1080;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedImage = canvas.toDataURL('image/jpeg', 0.8);

      // Upload compressed image to Firebase Storage
      const imageRef = ref(storage, `posts/${Date.now()}`);
      await uploadString(imageRef, compressedImage, 'data_url');
      const downloadURL = await getDownloadURL(imageRef);

      // Add post to Firestore
      await addDoc(collection(db, 'posts'), {
        username: 'User', // Replace with actual user data when auth is implemented
        userImage: 'https://placekitten.com/100/100', // Replace with actual user image
        image: downloadURL,
        caption: `Sharing my smile! 😊 (Smile Score: ${smileScore}%)`,
        timestamp: serverTimestamp(),
        likes: 0,
        smileScore
      });

      setShowCamera(false);
    } catch (error) {
      console.error('Error uploading post:', error);
    }
    setLoading(false);
  };

  return (
    <main className="max-w-xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Smile App</h1>
        <button
          onClick={() => setShowCamera(!showCamera)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          {showCamera ? 'Close Camera' : 'Share Smile'}
        </button>
      </div>

      {showCamera && (
        <div className="mb-6">
          <Camera onCapture={handleCapture} />
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-pulse">
            <p className="text-lg font-semibold">Processing your smile...</p>
            <p className="text-sm text-gray-500">This will only take a moment</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <Post
            key={post.id}
            username={post.username}
            userImage={post.userImage}
            image={post.image}
            caption={post.caption}
            timestamp={post.timestamp}
            likes={post.likes}
          />
        ))}
      </div>
    </main>
  );
}
