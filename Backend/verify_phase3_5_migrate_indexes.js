import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "./src/modules/auth/user.model.js";
import Attendance from "./src/modules/attendance/attendance.model.js";
import ClassSession from "./src/modules/classSession/classSession.model.js";
import Payroll from "./src/modules/payroll/payroll.model.js";

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Index Migration");

    const models = [
      { name: "User", model: User },
      { name: "Attendance", model: Attendance },
      { name: "ClassSession", model: ClassSession },
      { name: "Payroll", model: Payroll },
    ];

    for (const { name, model } of models) {
      console.log(`\nSyncing indexes for ${name}...`);
      try {
        await model.syncIndexes();
        console.log(`✅ ${name} indexes synced successfully.`);
      } catch (err) {
        console.error(`❌ Error syncing indexes for ${name}:`, err.message);
        
        // Try to manually drop index and recreate if syncIndexes fails due to conflict
        console.log(`Attempting to drop all indexes and recreate for ${name}...`);
        try {
          await model.collection.dropIndexes();
          await model.createIndexes();
          console.log(`✅ ${name} indexes dropped and recreated successfully.`);
        } catch (dropErr) {
          console.error(`❌ Failed to recreate indexes for ${name}:`, dropErr.message);
        }
      }
    }

    console.log("\nMigration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
