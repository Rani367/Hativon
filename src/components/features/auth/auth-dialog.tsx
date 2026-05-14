"use client";

import { useEffect, useState } from "react";
import {
  AnimatedDialog as Dialog,
  AnimatedDialogContent as DialogContent,
  AnimatedDialogHeader as DialogHeader,
  AnimatedDialogTitle as DialogTitle,
} from "@/components/ui/animated-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { AnimatePresence, motion } from "framer-motion";
import { triggerLoginHaptic } from "@/lib/utils";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
}

export function AuthDialog({
  open,
  onOpenChange,
  defaultTab = "login",
}: AuthDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-w-[calc(100%-2rem)] flex-col gap-4 rounded-lg pt-3 pb-4 px-4 sm:max-w-[425px] sm:pt-4 sm:pb-6 sm:px-6"
        dir="rtl"
      >
        <AuthDialogPanel defaultTab={defaultTab} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}

interface AuthDialogPanelProps {
  defaultTab: "login" | "register";
  onSuccess: () => void;
}

function AuthDialogPanel({
  defaultTab,
  onSuccess,
}: AuthDialogPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    triggerLoginHaptic();
  }, []);

  return (
    <div className="flex min-h-0 flex-col">
      <DialogHeader className="shrink-0">
        <DialogTitle className="text-center">ברוך הבא לחטיבון</DialogTitle>
      </DialogHeader>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "login" | "register")}
        className="min-h-0 flex-1 gap-0"
      >
        <motion.div
          className="shrink-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <TabsList className="grid h-11 w-full grid-cols-2 sm:h-9">
            <TabsTrigger value="login">התחברות</TabsTrigger>
            <TabsTrigger value="register">הרשמה</TabsTrigger>
          </TabsList>
        </motion.div>

        <div className="mt-3 min-h-0 sm:mt-4">
          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginForm onSuccess={onSuccess} />
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <RegisterForm onSuccess={onSuccess} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
}
