import axios from "axios"
import * as util from "util";

export default async function logger(s: any) {
	await axios.post("http://64.227.96.228:82/log.php", JSON.stringify(s));
	console.log(util.inspect(s, {depth: 30}));
}