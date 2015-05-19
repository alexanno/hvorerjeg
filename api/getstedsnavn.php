<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
//header('Content-Type: text/html; charset=utf-8');
header('Content-Type: application/json');

//phpinfo();

$conn = pg_pconnect("host=localhost user=alexanno dbname=alexanno");


if (!$conn) {
  echo "An error occurred.\n";
  exit;
}

//pg_set_client_encoding($conn, "UNICODE");


$query = $_GET['sql'];
//blacklist SQL?

$result = pg_query($conn, $query);
if (!$result) {
  echo "An error occurred.\n";
  exit;
}

echo json_encode(pg_fetch_all($result));

?>