/**
 * Migration: Add teacher support
 * Created: 2025-01-15
 *
 * Adds teacher/admin account support:
 * - is_teacher column on users table
 * - Makes grade and class_number nullable for teachers
 * - is_teacher_post column on posts table
 */

import { db } from "../client";
import type { Migration } from "./index";

const migration: Migration = {
  id: "20250115000000",
  name: "add_teacher_support",

  async up() {
    // Add is_teacher column to users table
    await db.query`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN DEFAULT FALSE
    `;

    // Make grade nullable for teachers
    await db.query`
      ALTER TABLE users
      ALTER COLUMN grade DROP NOT NULL
    `;

    // Make class_number nullable for teachers
    await db.query`
      ALTER TABLE users
      ALTER COLUMN class_number DROP NOT NULL
    `;

    // Add is_teacher_post column to posts table
    await db.query`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS is_teacher_post BOOLEAN DEFAULT FALSE
    `;

    console.log("[MIGRATION] Added teacher support columns");
  },

  async down() {
    // Remove is_teacher_post from posts
    await db.query`
      ALTER TABLE posts
      DROP COLUMN IF EXISTS is_teacher_post
    `;

    // Remove is_teacher from users
    await db.query`
      ALTER TABLE users
      DROP COLUMN IF EXISTS is_teacher
    `;

    // Note: Cannot easily restore NOT NULL constraints without potential data loss
    // Would need to set default values first for any NULL records

    console.log("[MIGRATION] Removed teacher support columns");
  },
};

export default migration;
