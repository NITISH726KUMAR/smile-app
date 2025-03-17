import React from 'react';
import Image from 'next/image';
import moment from 'moment';
import { HeartIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface PostProps {
  username: string;
  userImage: string;
  image: string;
  caption: string;
  timestamp: any;
  likes: number;
  isLiked?: boolean;
  onLike?: () => void;
}

const Post: React.FC<PostProps> = ({
  username,
  userImage,
  image,
  caption,
  timestamp,
  likes,
  isLiked = false,
  onLike
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm mb-6">
      {/* Header */}
      <div className="flex items-center p-4">
        <div className="h-10 w-10 relative rounded-full overflow-hidden">
          <Image
            src={userImage}
            alt={username}
            fill
            className="object-cover"
          />
        </div>
        <p className="font-semibold ml-3">{username}</p>
      </div>

      {/* Image */}
      <div className="relative aspect-square">
        <Image
          src={image}
          alt="Post"
          fill
          className="object-cover"
        />
      </div>

      {/* Buttons */}
      <div className="p-4">
        <div className="flex space-x-4">
          <button onClick={onLike}>
            {isLiked ? (
              <HeartIconSolid className="h-7 w-7 text-red-500" />
            ) : (
              <HeartIcon className="h-7 w-7" />
            )}
          </button>
          <ChatBubbleOvalLeftIcon className="h-7 w-7" />
        </div>
        <p className="font-bold mt-2">{likes} likes</p>
        <p className="mt-1">
          <span className="font-bold mr-2">{username}</span>
          {caption}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          {moment(timestamp).fromNow()}
        </p>
      </div>
    </div>
  );
};

export default Post; 