export interface Message {
  id: number;
  senderId: string;
  receiverId: string; // Added to explicitly track the recipient
  content: string;
  messageType: "text" | "image";
  createdAt: Date; // Added to track when the message was sent
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
}

export const USERS = [
  {
    id: "2",
    image: "/avatars/user2.png",
    name: "John Doe",
    email: "johndoe@gmail.com",
  },
  {
    id: "3",
    image: "/avatars/user3.png",
    name: "Elizabeth Smith",
    email: "elizabeth@gmail.com",
  },
  {
    id: "4",
    image: "/avatars/user4.png",
    name: "John Smith",
    email: "johnsmith@gmail.com",
  },
  {
    id: "5",
    image: "/avatars/user4.png",
    name: "Jane Doe",
    email: "janedoe@gmail.com",
  },
];

// Messages represent a conversation between USERS[0] (John Doe) and USERS[1] (Elizabeth Smith)
// Added receiverId and createdAt with simulated timestamps
export const messages: Message[] = [
  {
    id: 1,
    senderId: USERS[0].id, // "2" (John Doe)
    receiverId: USERS[1].id, // "3" (Elizabeth Smith)
    content: "Hello",
    messageType: "text",
    createdAt: new Date("2025-04-04T10:00:00Z"), // Simulated timestamp
  },
  {
    id: 2,
    senderId: USERS[1].id, // "3" (Elizabeth Smith)
    receiverId: USERS[0].id, // "2" (John Doe)
    content: "Hi",
    messageType: "text",
    createdAt: new Date("2025-04-04T10:01:00Z"),
  },
  {
    id: 3,
    senderId: USERS[0].id, // "2"
    receiverId: USERS[1].id, // "3"
    content: "How are you?",
    messageType: "text",
    createdAt: new Date("2025-04-04T10:02:00Z"),
  },
  {
    id: 4,
    senderId: USERS[1].id, // "3"
    receiverId: USERS[0].id, // "2"
    content: "I'm good",
    messageType: "text",
    createdAt: new Date("2025-04-04T10:03:00Z"),
  },
  {
    id: 5,
    senderId: USERS[0].id, // "2"
    receiverId: USERS[1].id, // "3"
    content: "What are you doing?",
    messageType: "text",
    createdAt: new Date("2025-04-04T10:04:00Z"),
  },
  {
    id: 6,
    senderId: USERS[1].id, // "3"
    receiverId: USERS[0].id, // "2"
    content: "Nothing much",
    messageType: "text",
    createdAt: new Date("2025-04-04T10:05:00Z"),
  },
  {
    id: 7,
    senderId: USERS[0].id, // "2"
    receiverId: USERS[1].id, // "3"
    content: "Cool",
    messageType: "text",
    createdAt: new Date("2025-04-04T10:06:00Z"),
  },
  {
    id: 8,
    senderId: USERS[1].id, // "3"
    receiverId: USERS[0].id, // "2"
    content: "Yeah",
    messageType: "text",
    createdAt: new Date("2025-04-04T10:07:00Z"),
  },
  {
    id: 9,
    senderId: USERS[0].id, // "2"
    receiverId: USERS[1].id, // "3"
    content: "Bye",
    messageType: "text",
    createdAt: new Date("2025-04-04T10:08:00Z"),
  },
  {
    id: 10,
    senderId: USERS[1].id, // "3"
    receiverId: USERS[0].id, // "2"
    content: "Bye",
    messageType: "text",
    createdAt: new Date("2025-04-04T10:09:00Z"),
  },
];
