import axios from "axios"
import * as util from "util";

export default async function logger(s: any) {
	console.log(util.inspect(s, {depth: 30}));
}