const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js")
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();

const app = express();

app.set("view engine", "ejs");

let workItems = [];

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-" + ADMIN + ":" + PASSWORD + "@cluster0.tiprfrd.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

const today = date();

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = new mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button!"
});

const item3 = new Item({
  name: "<-- Check this to delete an item"
});

const defaultItems = [item1, item2, item3]



const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = new mongoose.model("List", listSchema);


app.get("/", function(req, res) {



  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Done!");
        }

      });
    } else {
      res.render("list", {
        listTitle: today,
        newListitems: foundItems
      });
    }
  });

});


app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);



  List.findOne({ name: customListName}, function(err, foundList) {
    if(!err){
      if(!foundList){
        console.log("Doesn't exsists");

        const list = new List({
          name: customListName,
          items: defaultItems
        })

        list.save();
        res.redirect("/"+customListName);
      }
      else{
        res.render("list.ejs", {
          listTitle: customListName,
          newListitems: foundList.items
        });
      }
    }

  })


})

app.post("/", function(req, res) {


  // let item = req.body.newItem;
  //
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work")
  // } else {
  //   items.push(item);
  //   res.redirect("/")
  // }

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if( listName === today){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

})

app.post("/delete", function(req, res){
const checkedItemID = req.body.checkbox;
const listName = req.body.listName;

if( listName === today){
  Item.findByIdAndRemove(checkedItemID, function(err){
    if (err) {
      console.log(err);
    } else {
      console.log("Removed this data!");
      res.redirect("/");
    }
  })
}else {
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
    if(!err){
      res.redirect("/" + listName);
    }
  })
}


});




app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
})
