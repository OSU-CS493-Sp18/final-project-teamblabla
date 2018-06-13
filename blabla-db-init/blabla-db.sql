/*We need to make a cities table because this will be a many to many relationship with rides*/
CREATE TABLE cities(
  CityID INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,
  PRIMARY KEY (CityID)
) ENGINE=InnoDB;

CREATE TABLE rides (
  RideID INT NOT NULL AUTO_INCREMENT,
  DriverID INT NOT NULL, /*INT may need to be changed to work with mongo*/
  price INT NOT NULL, /*This is subject to change if you would like to use a different data type.*/
  CarDescription TEXT NOT NULL,
  DepartureID INT NOT NULL, /*Dont include this in the list of cities passed through */
  FOREIGN KEY(DepartureID) REFERENCES cities(CityID) ON DELETE CASCADE,
  PRIMARY KEY (RideID)
) ENGINE=InnoDB;

/*This is the many to many relationship between cities and rides */
CREATE TABLE CitiesPassedThrough (
  CityID INT NOT NULL,
  RideID INT NOT NULL,
  FOREIGN KEY(CityID) REFERENCES cities(CityID) ON DELETE CASCADE,
  FOREIGN KEY(RideID) REFERENCES rides(RideID) ON DELETE CASCADE
)ENGINE=InnoDB;



/*This is the many to many relationship for a rides passengers between rides and users. */
CREATE TABLE CurrentPassengers (
  UserID INT NOT NULL, /*This references the ID from MongoDB*/
  RideID INT NOT NULL,
  FOREIGN KEY(RideID) REFERENCES rides(RideID) ON DELETE CASCADE
)ENGINE=InnoDB;

/*Here we can create reviews*/
CREATE TABLE reviews (
ReviewID INT NOT NULL AUTO_INCREMENT,
UserID INT NOT NULL,
DriverID INT NOT NULL,
RideID INT NOT NULL,
Stars INT NOT NULL, /*Guessing it is out of 5 stars */
Description TEXT,
PRIMARY KEY(ReviewID)
)ENGINE=InnoDB;

/* Inserts for cities */
INSERT INTO cities (Name) VALUES ('Portland');
INSERT INTO cities (Name) VALUES ('Salem');
INSERT INTO cities (Name) VALUES ('Corvallis');
INSERT INTO cities (Name) VALUES ('Oregon City');

/*Inserts for rides*/
INSERT INTO rides (DriverID, price, CarDescription, DepartureID) VALUES (1, 3, "Red Kia", 2);
INSERT INTO rides (DriverID, price, CarDescription, DepartureID) VALUES (3, 5, "Blue Honda", 3);
INSERT INTO rides (DriverID, price, CarDescription, DepartureID) VALUES (1, 4, "Red Kia", 1);
INSERT INTO rides (DriverID, price, CarDescription, DepartureID) VALUES (2, 1, "Green Toyota", 4);

/*Inserts for Current Passengers in a rides*/
INSERT INTO CurrentPassengers (UserID, RideID) VALUES (1, 2);
INSERT INTO CurrentPassengers (UserID, RideID) VALUES (1, 1);
INSERT INTO CurrentPassengers (UserID, RideID) VALUES (2, 2);
INSERT INTO CurrentPassengers (UserID, RideID) VALUES (2, 3);
INSERT INTO CurrentPassengers (UserID, RideID) VALUES (3, 3);

/*Inserst for the cities that a ride will pass through */
INSERT INTO CitiesPassedThrough (CityID, RideID) VALUES (1, 3);
INSERT INTO CitiesPassedThrough (CityID, RideID) VALUES (2, 3);
INSERT INTO CitiesPassedThrough (CityID, RideID) VALUES (3, 3);
INSERT INTO CitiesPassedThrough (CityID, RideID) VALUES (2, 1);
INSERT INTO CitiesPassedThrough (CityID, RideID) VALUES (4, 1);
INSERT INTO CitiesPassedThrough (CityID, RideID) VALUES (3, 1);
INSERT INTO CitiesPassedThrough (CityID, RideID) VALUES (2, 2);
INSERT INTO CitiesPassedThrough (CityID, RideID) VALUES (1, 2);
INSERT INTO CitiesPassedThrough (CityID, RideID) VALUES (1, 4);
INSERT INTO CitiesPassedThrough (CityID, RideID) VALUES (4, 4);

/*Insert for reviews*/
INSERT INTO reviews (UserID, DriverID, RideID, Stars, Description) VALUES (1, 2, 1, 3, "This driver was friendly but smelled");
INSERT INTO reviews (UserID, DriverID, RideID, Stars, Description) VALUES (2, 1, 1, 1, "He got in a crash");
INSERT INTO reviews (UserID, DriverID, RideID, Stars, Description) VALUES (3, 2, 1, 5, "Great trip, would ride with again!");
INSERT INTO reviews (UserID, DriverID, RideID, Stars, Description) VALUES (1, 3, 1, 4, "This driver has great taste in music");
INSERT INTO reviews (UserID, DriverID, RideID, Stars, Description) VALUES (2, 3, 1, 1, "The driver got a speeding ticket on our way there");
