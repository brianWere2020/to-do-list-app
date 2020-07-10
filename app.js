const express = require("express");
const bodyParser = require("body-parser");

// require mongoose
const mongoose = require("mongoose");

// require lodash
const _ = require("lodash");

const app = express();

// setting up EJS to work with express
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

// the below line points express to "serve up" contents of the "public" folder ie. the css style sheets and any other files or images
app.use(express.static("public"));

// connect to mongoDB Atlas and create Items database using mongoose
mongoose.connect("mongodb+srv://admin:@Goodidea101@cluster0.6odmi.mongodb.net/toDoListDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// create items schema with mongoose
const itemsSchema = {
  name: String,
};

// create new items model
const Item = mongoose.model("Item", itemsSchema);

// create the items in the collection
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

// create an array to store the items
const defaultItems = [item1, item2, item3];

// create listSchema with mongoose
const listSchema = {
  name: String,
  items: [itemsSchema],
};

// create new list model
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  // Find all documents inside the Items collection so as to send it over to list.ejs to render in the to do list
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      // to address what happens when the foundItems array is empty ie redirect to home route
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

// use express route parameters to create a dynamic route
// this way you can type for instance "localhost:3000/Anything" in the browser without hard coding it
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  // itemName below is equal to the value of the name attribute of the input element of type = "checkbox" in the list.ejst file
  // listName below is equal to the value of the name attribute of the second input element of type = "hidden" in the list.ejst file
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    // save item
    item.save();
    // Redirect to the home route to run the code therein
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// adding delete post route as follows to cater for clearing the to-do list
app.post("/delete", function (req, res) {
  // note that "checkbox" is the value of the name = "checkbox" attribute of the input element of type = checkbox in the list.ejs file
  // "req.body.checkbox" gives the _id of the items collection in the toDoListDB
  // this is because of the value = "<%= item._id %> " attribute of the input element of type = "checkbox" in the list.ejs file
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    // remove the item from the database that has an _id of checkedItemId
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      // delete from an array in mongoDB using the pull operator
        // pull from items array an item that has an Id that corresponds to the checkedItemId
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

// configuring heroku server to listen in the correct port (process.env.PORT) as well as use the localhost 2000
// note that the version of node used has been specifide for heroku in package.json file below license

let port = process.env.PORT;
if (port == null || port == "") {
  port = 2000;
}
app.listen(port, function () {
  console.log("Server started successfully!");
});
