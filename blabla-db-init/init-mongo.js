db.createUser({
  user: "User",
  pwd: "hunter2",
  roles: [ { role: "readWrite", db: "blabla" } ]
});

db.users.insertMany([
	{ userID: "1", name: "Bill", password: "password", verified: "yes", rating: "5", MemberSince: "5/7/2016"},
	{ userID: "2", name: "John", password: "password1", verified: "no", rating: "3", MemberSince: "1/2/2018"},
  { userID: "3", name: "Jenny", password: "password2", verified: "yes", rating: "4", MemberSince: "6/19/2017"},
]);
