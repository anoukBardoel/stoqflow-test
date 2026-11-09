const RegEx = {
	//unique id from the random package, 17 chars of the meteor id character set
	Id: /^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/,
	//sku-like code, uppercase letters, digits and dashes, at least 2 chars
	Code: /^[A-Z0-9][A-Z0-9-]{1,31}$/
};

export default RegEx;
