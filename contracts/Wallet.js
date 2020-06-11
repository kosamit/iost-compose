class Wallet {
    init(){};
    can_update(data) {
        return blockchain.requireAuth(blockchain.contractOwner(), 'active');
    }
    set(id, permission, data) {
        this._requireAuth(id);
        if(permission !== 'active' && permission !== 'owner') {
            throw new Error('bad permission');
        }
        storage.mapPut(permission, id, data, id);
        return data;
    }
    get(id, permission) {
        return storage.mapGet(permission, id);
    }
    _requireAuth(id) {
        let auth = true;
        if(blockchain.requireAuth(id, 'active')) auth = true;
        if(blockchain.requireAuth(id, 'owner')) auth = true;
        if(!auth) {
            throw new Error('PERMISISON_DENIED');
        }
    }
}
module.exports = Wallet;