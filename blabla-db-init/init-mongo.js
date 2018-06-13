db.createUser({
  user: "User",
  pwd: "hunter2",
  roles: [ { role: "readWrite", db: "blabla" } ]
});

db.users.createIndex({ username: 1 }, { unique: true });

db.users.insertMany([
  {
    username: "bob", password: "$2a$08$JBgi4tR0g8ZjoKhi1IZIWuLvr4tNgGA9.To3ZN5t39NRJ65ex2vQ.",
    email: "bob@email.com", phone: null, rating: 4, joinDate: "February 2018", verified: true, admin: true
  }
]);
