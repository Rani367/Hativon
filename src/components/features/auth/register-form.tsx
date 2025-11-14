'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Grade } from '@/types/user.types';
import { motion } from 'framer-motion';
import { buttonVariants } from '@/lib/utils';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [classNumber, setClassNumber] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }

    if (!grade) {
      setError('יש לבחור כיתה');
      return;
    }

    if (!classNumber) {
      setError('יש לבחור מספר כיתה');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        username,
        password,
        displayName,
        grade: grade as Grade,
        classNumber: classNumber as number,
      });

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.message || 'הרשמה נכשלה');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        <Label htmlFor="register-username" className="text-right block">שם משתמש</Label>
        <Input
          id="register-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
          placeholder="אותיות אנגליות ומספרים בלבד"
          pattern="[a-zA-Z0-9_]{3,50}"
          className="text-right transition-all duration-200 focus:scale-[1.01]"
        />
        <p className="text-xs text-muted-foreground text-right">3-50 תווים (אותיות אנגליות, מספרים וקו תחתון)</p>
      </motion.div>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Label htmlFor="register-displayName" className="text-right block">שם מלא</Label>
        <Input
          id="register-displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          disabled={loading}
          placeholder="השם שיוצג בפוסטים שלך"
          className="text-right transition-all duration-200 focus:scale-[1.01]"
        />
      </motion.div>

      <motion.div
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="register-classNumber" className="text-right block">מספר כיתה</Label>
          <Select value={classNumber.toString()} onValueChange={(value) => setClassNumber(Number(value))} disabled={loading}>
            <SelectTrigger id="register-classNumber" className="w-full" dir="rtl">
              <SelectValue placeholder="בחר מספר" />
            </SelectTrigger>
            <SelectContent className="text-right" dir="rtl">
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label htmlFor="register-grade" className="text-right block">כיתה</Label>
          <Select value={grade} onValueChange={(value) => setGrade(value as Grade)} disabled={loading}>
            <SelectTrigger id="register-grade" className="w-full" dir="rtl">
              <SelectValue placeholder="בחר כיתה" />
            </SelectTrigger>
            <SelectContent className="text-right" dir="rtl">
              <SelectItem value="ז">כיתה ז</SelectItem>
              <SelectItem value="ח">כיתה ח</SelectItem>
              <SelectItem value="ט">כיתה ט</SelectItem>
              <SelectItem value="י">כיתה י</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Label htmlFor="register-password" className="text-right block">סיסמה</Label>
        <Input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="לפחות 8 תווים"
          minLength={8}
          className="text-right transition-all duration-200 focus:scale-[1.01]"
        />
      </motion.div>

      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <Label htmlFor="register-confirmPassword" className="text-right block">אימות סיסמה</Label>
        <Input
          id="register-confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="הזן סיסמה שוב"
          minLength={8}
          className="text-right transition-all duration-200 focus:scale-[1.01]"
        />
      </motion.div>

      {error && (
        <motion.div
          className="text-sm text-red-600 dark:text-red-400 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        whileHover="hover"
        whileTap="tap"
        variants={buttonVariants}
      >
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'נרשם...' : 'הרשם'}
        </Button>
      </motion.div>
    </form>
  );
}
