import pool from "./index";

pool.query("SELECT NOW()", (err, res) => {
  if (err) console.error(err);
  else console.log("DB connected", res.rows[0]);
});
