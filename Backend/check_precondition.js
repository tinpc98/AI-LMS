import mongoose from "mongoose";

await mongoose.connect("mongodb://127.0.0.1:27017/eduspace_thpt?replicaSet=rs0");
const db = mongoose.connection.db;

// List all collections with counts
const cols = await db.listCollections().toArray();
const counts = {};
for (const col of cols) {
  const count = await db.collection(col.name).countDocuments();
  counts[col.name] = count;
}

console.log("ALL COLLECTIONS WITH COUNT:");
Object.entries(counts).sort((a,b) => b[1]-a[1]).forEach(([name, count]) => {
  console.log(`  ${count.toString().padStart(5)} | ${name}`);
});

process.exit(0);
