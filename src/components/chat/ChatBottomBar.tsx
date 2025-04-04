import { AnimatePresence, motion } from "framer-motion";
import {
  Image as ImageIcon,
  Loader,
  SendHorizontal,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import { Textarea } from "../ui/textarea";
import { useEffect, useRef, useState } from "react";
import EmojiPicker from "./EmojiPicker";
import { Button } from "../ui/button";
import useSound from "use-sound";
import { usePreferences } from "@/store/usePreferences";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessageAction } from "@/actions/message.actions";
import { useSelectedUser } from "@/store/useSelectedUser";
import { CldUploadWidget, CloudinaryUploadWidgetInfo } from "next-cloudinary";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { pusherClient } from "@/lib/pusher";
import { Message } from "@/db/dummy";

// Type definitions
interface SendMessageResponse {
  success: boolean;
  message?: string;
  conversationId?: string;
  messageId?: string;
}

interface SendMessageActionArgs {
  content: string;
  messageType: "text" | "image";
  receiverId: string;
}

// Explicitly type as React Functional Component
const ChatBottomBar: React.FC = () => {
  const [message, setMessage] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedUser } = useSelectedUser();
  const { user: currentUser } = useKindeBrowserClient();
  const { soundEnabled } = usePreferences();
  const queryClient = useQueryClient();
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  const [playSound1] = useSound("/sounds/keystroke1.mp3");
  const [playSound2] = useSound("/sounds/keystroke2.mp3");
  const [playSound3] = useSound("/sounds/keystroke3.mp3");
  const [playSound4] = useSound("/sounds/keystroke4.mp3");
  const [playNotificationSound] = useSound("/sounds/notification.mp3");

  const playSoundFunctions = [playSound1, playSound2, playSound3, playSound4];
  const playRandomKeyStrokeSound = () => {
    if (soundEnabled) {
      const randomIndex = Math.floor(Math.random() * playSoundFunctions.length);
      playSoundFunctions[randomIndex]();
    }
  };

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: (args: SendMessageActionArgs) => sendMessageAction(args),
    onMutate: async (newMessage) => {
      if (!selectedUser?.id || !currentUser?.id) return;
      const queryKey = ["messages", selectedUser.id];
      await queryClient.cancelQueries({ queryKey });

      const previousMessages =
        queryClient.getQueryData<Message[]>(queryKey) || [];
      const optimisticMessage: Message = {
        id: Date.now(), // temp ID
        content: newMessage.content,
        messageType: newMessage.messageType,
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        createdAt: new Date(), // Add createdAt as Date here
      };
      queryClient.setQueryData(queryKey, (old: Message[] = []) => [
        ...old,
        optimisticMessage,
      ]);
      return { previousMessages, optimisticId: optimisticMessage.id };
    },
    onError: (_err, _newMessage, context) => {
      if (selectedUser?.id && context?.previousMessages) {
        queryClient.setQueryData(
          ["messages", selectedUser.id],
          context.previousMessages
        );
      }
    },
    onSuccess: (data: SendMessageResponse, _newMessage, context) => {
      if (
        !selectedUser?.id ||
        !currentUser?.id ||
        !data.success ||
        !data.messageId
      )
        return;

      const finalMessage: Message = {
        id: parseInt(data.messageId),
        content: _newMessage.content,
        messageType: _newMessage.messageType,
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        createdAt: new Date(),
      };

      const queryKey = ["messages", selectedUser.id];
      queryClient.setQueryData(queryKey, (old: Message[] = []) => {
        return [
          ...old.filter((msg) => msg.id !== context?.optimisticId),
          finalMessage,
        ];
      });
    },
    onSettled: () => {
      if (selectedUser?.id) {
        queryClient.invalidateQueries({
          queryKey: ["messages", selectedUser.id],
        });
      }
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !selectedUser?.id || !currentUser?.id) return;
    sendMessage({
      content: message,
      messageType: "text",
      receiverId: selectedUser.id,
    });
    setMessage("");
    textAreaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      setMessage((prev) => prev + "\n");
    }
  };

  useEffect(() => {
    if (!currentUser?.id || !selectedUser?.id) return;
    const channelName = [currentUser.id, selectedUser.id].sort().join("__");
    const channel = pusherClient.subscribe(channelName);

    const handleNewMessage = (data: { message: Message }) => {
      queryClient.setQueryData(
        ["messages", selectedUser.id],
        (oldMessages: Message[] = []) => {
          const exists = oldMessages.some((msg) => msg.id === data.message.id);
          return exists ? oldMessages : [...oldMessages, data.message];
        }
      );
      if (soundEnabled && data.message.senderId !== currentUser.id) {
        playNotificationSound();
      }
    };

    channel.bind("newMessage", handleNewMessage);
    return () => {
      channel.unbind("newMessage", handleNewMessage);
      pusherClient.unsubscribe(channelName);
    };
  }, [
    currentUser?.id,
    selectedUser?.id,
    queryClient,
    playNotificationSound,
    soundEnabled,
  ]);

  return (
    <div className="p-2 flex justify-between w-full items-center gap-2">
      {!message.trim() && (
        <CldUploadWidget
          signatureEndpoint="/api/sign-cloudinary-params"
          onSuccess={(result, { widget }) => {
            setImgUrl((result.info as CloudinaryUploadWidgetInfo).secure_url);
            widget.close();
          }}
        >
          {({ open }) => (
            <ImageIcon
              size={20}
              onClick={() => open()}
              className="cursor-pointer text-muted-foreground"
            />
          )}
        </CldUploadWidget>
      )}

      <Dialog open={!!imgUrl} onOpenChange={() => setImgUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center relative h-96 w-full mx-auto">
            {imgUrl && (
              <Image
                src={imgUrl}
                alt="Image Preview"
                fill
                className="object-contain"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={() => {
                if (!selectedUser?.id || !imgUrl) return;
                sendMessage({
                  content: imgUrl,
                  messageType: "image",
                  receiverId: selectedUser.id,
                });
                setImgUrl(null);
              }}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        <motion.div
          key="input"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.5 },
            layout: { type: "spring", bounce: 0.15 },
          }}
          className="w-full relative"
        >
          <Textarea
            autoComplete="off"
            placeholder="Aa"
            rows={1}
            className="w-full border rounded-full flex items-center h-9 resize-none overflow-hidden bg-background min-h-0"
            value={message}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setMessage(e.target.value);
              playRandomKeyStrokeSound();
            }}
            ref={textAreaRef}
          />
          <div className="absolute right-2 bottom-0.5">
            <EmojiPicker
              onChange={(emoji) => {
                setMessage((prev) => prev + emoji);
                textAreaRef.current?.focus();
              }}
            />
          </div>
        </motion.div>

        {message.trim() ? (
          <Button
            key="send-button"
            className="h-9 w-9 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white shrink-0"
            variant="ghost"
            size="icon"
            onClick={handleSendMessage}
            disabled={isPending}
          >
            {isPending ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <SendHorizontal size={20} className="text-muted-foreground" />
            )}
          </Button>
        ) : (
          <Button
            key="thumbs-up-button"
            className="h-9 w-9 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white shrink-0"
            variant="ghost"
            size="icon"
            disabled={isPending}
          >
            {isPending ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <ThumbsUp
                size={20}
                className="text-muted-foreground"
                onClick={() => {
                  if (!selectedUser?.id) return;
                  sendMessage({
                    content: "👍",
                    messageType: "text",
                    receiverId: selectedUser.id,
                  });
                }}
              />
            )}
          </Button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatBottomBar;
