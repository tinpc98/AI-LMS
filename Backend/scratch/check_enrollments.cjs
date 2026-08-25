const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/eduspace_thpt')
  .then(async () => {
    const enrolls = await mongoose.connection.db.collection('classenrollments').find().toArray();
    const userIds = enrolls.map(e => e.studentId.toString());
    const users = await mongoose.connection.db.collection('users').find({ _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } }).toArray();
    
    console.log(JSON.stringify({
      totalEnrollments: enrolls.length,
      usersFoundForEnrollments: users.length,
      users: users.map(u => u.fullName)
    }, null, 2));
    process.exit(0);
  });
