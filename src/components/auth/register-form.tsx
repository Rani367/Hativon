'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Grade } from '@/types/user.types';

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

    // Validation
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
      <div className="space-y-2">
        <Label htmlFor="register-username">שם משתמש</Label>
        <Input
          id="register-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
          placeholder="אותיות אנגליות ומספרים בלבד"
          pattern="[a-zA-Z0-9_]{3,50}"
        />
        <p className="text-xs text-muted-foreground">3-50 תווים (אותיות אנגליות, מספרים וקו תחתון)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-displayName">שם מלא</Label>
        <Input
          id="register-displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          disabled={loading}
          placeholder="השם שיוצג בפוסטים שלך"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-grade">כיתה</Label>
        <Select value={grade} onValueChange={(value) => setGrade(value as Grade)} disabled={loading}>
          <SelectTrigger id="register-grade">
            <SelectValue placeholder="בחר כיתה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ז">כיתה ז</SelectItem>
            <SelectItem value="ח">כיתה ח</SelectItem>
            <SelectItem value="ט">כיתה ט</SelectItem>
            <SelectItem value="י">כיתה י</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-classNumber">מספר כיתה</Label>
        <Select value={classNumber.toString()} onValueChange={(value) => setClassNumber(Number(value))} disabled={loading}>
          <SelectTrigger id="register-classNumber">
            <SelectValue placeholder="בחר מספר" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">סיסמה</Label>
        <Input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="לפחות 8 תווים"
          minLength={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirmPassword">אימות סיסמה</Label>
        <Input
          id="register-confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="הזן את הסיסמה שוב"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'נרשם...' : 'הרשם'}
      </Button>
    </form>
  );
}
