const bannedServers = ['1193021133981765632'];

const isBanned = async function (serverid) {
	if (bannedServers.includes(serverid)) return true;

	return false;
};

module.exports = isBanned;
