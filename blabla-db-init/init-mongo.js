db.createUser({
  user: "User",
  pwd: "hunter2",
  roles: [ { role: "readWrite", db: "blabla" } ]
});

db.users.createIndex({ username: 1 }, { unique: true });

db.users.insertMany([
	// { userID: "1", name: "Bill", password: "password", verified: "yes", rating: "5", MemberSince: "5/7/2016"},
	// { userID: "2", name: "John", password: "password1", verified: "no", rating: "3", MemberSince: "1/2/2018"},
  // { userID: "3", name: "Jenny", password: "password2", verified: "yes", rating: "4", MemberSince: "6/19/2017"},
  {
    username: "bob", password: "password", email: "bob@email.com", phone: null,
    rating: 4, joinDate: "February 2018", verified: true, admin: true
  },
  {
    username: "mike", password: "password", email: null, phone: null,
    rating: 1, joinDate: "April 2018", verified: false, admin: false
  },
  {
    username: "jenny", password: "password", email: null, phone: "0123456789",
    rating: 5, joinDate: "May 2018", verified: true, admin: false
  }
]);
