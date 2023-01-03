const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash'); // Load the full build.


// require  env variables
require("dotenv").config();
const srvr = process.env.N1_KEY;
const srvrCred = process.env.N1_SECRET;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.set("strictQuery", true);
app.use(express.static("public"));

mongoose.connect("mongodb+srv://" + srvr + ":" + srvrCred + "@cluster0.7lrev0m.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add an item."]
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist:"
});

const item2 = new Item({
  name: "Hit the + button to odd a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

//every new list will have a name and an array of item document associated with it
const listSchema = {
  name: String,
  items: [itemsSchema] // array of schema based items
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundedItems) { // gives back an array find{}, so we've to check the array's length
    if (foundedItems.length === 0) {
      Item.insertMany([item1, item2, item3], function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully insert default items to todolistDB");
        }
      });
      res.redirect("/");
    } else {
      //pass over items that are inside our items collection
      res.render("list", {
        listTitle: "Today",
        newListItems: foundedItems
      });
    }
  });
});

app.get("/:customListName", function(req, res) { // using exporess routing to tap in a dynamic URL
  const customListName = _.capitalize(req.params.customListName);

  //if there is an error print it, if not tap into the founded list
  //check if a collection with that custom name exists, if does display it
  //if not create new one add it to our collection list
  List.findOne({
    name: customListName
  }, function(err, customList) { //get back an object (findOne)
    if (!err) {
      if (!customList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: [item1, item2, item3]
        });
        list.save(); // save the created document list into list collection
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: customList.name,
          newListItems: customList.items
        });
      }
    } else {
      console.log(err);
    };
  });
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem; // text input by the user
  const listName = req.body.list; // the name of the button and its value "listTitle" is the list that the item has been added to
  if (!itemName) {
    res.render("alert");
  } else {
    const item = new Item({ //create new item document based on model in mongodb
      name: itemName
    });

    if (listName === "Today") {
      item.save(); // save the item in our items collection
      res.redirect("/"); // reinter the root route to render the added item in the screen (find on get/)

    } else { //if the item comes from a custom list
      List.findOne({
        name: listName
      }, function(err, foundList) { // find that custom list
        foundList.items.push(item); // add that new item to items in that list
        foundList.save();
        res.redirect("/" + listName); // redirect back to that list
      });
    }
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox; //id of checked off item
  const listName = req.body.listName; //name of list, taken from "hidden input" line of form

  if (listName === "Today") { // delete request coming from the default list
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted the checked item");
        res.redirect("/");
      }
    });

  } else { // delete request coming from custom list
    // find the list that has that current ListName (using hidden input)
    // Update that list to remove the checked item with that particular checkedItemId
    // Prob: inside our list document there is an array of item document => find the
    // particulat item with the checkedItemId then remove the entire item from the list
    // look for: mongoose remove document from an array
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + listName);
      };
    });


};
});

app.get("/about", function(req, res) {
  res.render("about");
});

// app.listen(3000, function() {
//   console.log("Server started on port 3000");
// });

app.listen(process.env.PORT || 3000, function () {
console.log("Server started.");
 });
