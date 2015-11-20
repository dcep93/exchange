// Retrieve all listings
QUnit.asyncTest("Retrieve all listings", function(assert){
  $.ajax({
    url: "/listings",
    type: "get",
    success: function(data){
      assert.ok(true, "Listing successfully retrieved");
      start();
    },
    error: function(xhr, status){
      console.log(xhr.status);
    }
  });
});

// Retrieve listing with a specific ID
QUnit.asyncTest("Retrieve listing with specific ID", function(assert){
//Step 1: Insert a new listing
  $.ajax({
    url: "/listings",
    type: "post",
    data: {"title": "test_title", "description": "test_descrition", "image": "test_image"},
    success: function(data){

//Step 2: Retrieve that listing
      $.ajax({
        user: "/listings",
        type: "get",
        success: function(data){
            assert.ok(true, "");
            start();
        },
        error: function(xhr, status){
          console.log("fail1");
          console.log(xhr.status);
        }
      })
      
    },
    error: function(xhr, status){
      console.log("fail2");
      console.log(xhr.status);
    }
  });
});