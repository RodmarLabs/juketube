<?php

$servername = "127.0.0.1";
$username = "rodmarza_juketub";
$password = "826455";
$dbname = "rodmarza_juketube";

$action = $_GET['action'];

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if($action == 'getUpcoming'){
    $sql = "SELECT * FROM queue ORDER BY queue_at ASC";

    $result = $conn->query($sql);
    $resultArray = array();

    if ($result->num_rows > 0) {
        $i = 0;
        while($row = $result->fetch_assoc()) {
            $resultArray[$i]['id'] = $row['id'];
            $resultArray[$i]['title'] = $row['title'];
            $i++;
        }
    }
    $conn->close();

    echo json_encode($resultArray);
    exit;
}

if($action == 'deleteVideo'){
    $id = $_GET['id'];
    $sql = "DELETE FROM queue WHERE id = '". $id ."'";
    $result = $conn->query($sql);

    if($result){
        echo json_encode(array('code' => 200, 'message' => 'Video deleted!'));
    }else{
        echo json_encode(array('code' => 500, 'message' => 'Error deleting video!', 'sql' => $sql));
    }

    $conn->close();
    exit;
}

if($action == 'queueVideo'){
    $id = $_GET['id'];
    $title = $_GET['title'];
    $queue_at = date('Y-m-d H:i:s');

    $sql = "INSERT INTO queue (id, title, queue_at) VALUES ('". $id ."', '". $title ."', '". $queue_at ."')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(array('code' => 200, 'message' => 'Success'));
    } else {
        echo json_encode(array('code' => 500, 'message' => 'Error'));
    }

    $conn->close();
    exit;
}

echo json_encode(array('code' => 200, 'message' => 'Hello World!'));