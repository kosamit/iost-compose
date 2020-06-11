const _Hub = 'Contract8VfwmDLkrwZV6D915KaRoA27ZwadrAQ1p68egY25nfYy';
const _subjects = ['running_voting', 'finished_voting', 'executable'];
const _events = ['execute'];
const _listeners = [];
const _symbol = 'gkyc01';
class Spoke {
    init() {
        _subjects.forEach(subject => {
            blockchain.callWithAuth(_Hub, 'addSubject', [subject, blockchain.contractName()])
        });
        _events.forEach(event => {
            blockchain.callWithAuth(_Hub, 'addEvent', [event, blockchain.contractName()])
        });
        _listeners.forEach(listener => {
            blockchain.callWithAuth(_Hub, 'addListener', [listener, blockchain.contractName()])
        })
    }
    can_update(data) { return true }
    /**
     * 
     */
    notify() {
        let notifications = JSON.parse(storage.globalGet(_Hub, 'notifications'));
        let notification = notifications[notifications.length - 1];
        let funcName = '_' + notification.event + 'Listener';
        if (typeof this[funcName] === 'function') {
            this[funcName](notification.message)
        }
    }
    /**
     * 
     * @param {string} algo 
     * @param {string} contract 
     */
    addAlgo(algo, contract) {
        if (contract === blockchain.contractName()) {
            throw new Error('contract name is matched @' + contract)
        }
        if (storage.mapHas('algo', algo)) {
            throw new Error('already registered @' + algo)
        }
        if (!blockchain.requireAuth(blockchain.contractOwner(), 'active')) {
            throw new Error('permission denied @' + blockchain.contractOwner())
        }
        if (!blockchain.requireAuth(contract, 'active')) {
            throw new Error('permission denied @' + contract)
        }
        storage.mapPut('algo', algo, contract)
    }
    /**
     * 
     * @param {string} gsymbol 
     * @param {string} gid 
     * @param {string} algo 
     * @param {string} theme 
     * @param {string} deadline 
     * @param {string} choices 
     */
    create(gsymbol, gid, algo, theme, deadline, choices) {
        let member = JSON.parse(storage.globalMapGet(_Hub, 'member', gsymbol)).member;
        if (member.indexOf(gid) === -1) {
            throw new Error('not member @' + gid)
        }
        let tokenID = storage.globalMapGet(_Hub, 'tokenID', gid);
        if (tokenID === null) {
            throw new Error('gid not found @' + gid)
        }
        let owner = blockchain.call('token721.iost', 'ownerOf', [_symbol, tokenID])[0];
        if (!blockchain.requireAuth(owner, 'active')) {
            throw new Error('permission denied @' + owner)
        }
        let contract = storage.mapGet('algo', algo);
        if (contract === null) {
            throw new Error('algo not found @' + algo)
        }
        if (deadline.length !== 19) {
            throw new Error('invalid time order @' + deadline)
        }
        deadline = new BigNumber(deadline);
        if (deadline.lt(tx.time)) {
            throw new Error('past time @' + deadline)
        }
        if ((deadline.minus(tx.time)).gt(1944000 * 1e9)) {
            throw new Error('voting time range cannot over a month @' + deadline)
        }
        let duplicateChecker = [];
        choices = JSON.parse(choices);
        choices.forEach(choice => {
            if (duplicateChecker.indexOf(choice) !== -1) {
                throw new Error('duplicate choice @' + choice)
            }
        })
        let rule = JSON.parse(storage.globalMapGet(_Hub, 'rule', gsymbol));
        blockchain.callWithAuth(contract, 'create', [JSON.stringify(member), JSON.stringify(choices), JSON.stringify({
            minSupportRate: 0,
            minVotingRate: rule.minVotingRate
        })]);
        let running = JSON.parse(storage.globalMapGet(_Hub, 'running_voting', gsymbol));
        if (running === null) {
            running = []
        }
        running.push(tx.hash);
        storage.mapPut('info', tx.hash, JSON.stringify({ theme, algo, deadline }));
        this._update('running_voting', gsymbol, JSON.stringify(running));
        return tx.hash
    }
    /**
     * 
     * @param {string} hash 
     * @param {string} gid 
     * @param {string} action 
     * @param {string} config 
     */
    executionCreate(gsymbol, gid, algo, theme, deadline, action, options) {
        let member = JSON.parse(storage.globalMapGet(_Hub, 'member', gsymbol)).member;
        if (member.indexOf(gid) === -1) {
            throw new Error('not member @' + gid)
        }
        let tokenID = storage.globalMapGet(_Hub, 'tokenID', gid);
        if (tokenID === null) {
            throw new Error('gid not found @' + gid)
        }
        let owner = blockchain.call('token721.iost', 'ownerOf', [_symbol, tokenID])[0];
        if (!blockchain.requireAuth(owner, 'active')) {
            throw new Error('permission denied @' + owner)
        }
        let contract = storage.mapGet('algo', algo);
        if (contract === null) {
            throw new Error(algo + ': algo not found')
        }
        if (deadline.length !== 19) {
            throw new Error('invalid time order @' + deadline)
        }
        deadline = new BigNumber(deadline);
        if (deadline.lt(tx.time)) {
            throw new Error('past time @' + deadline)
        }
        if ((deadline.minus(tx.time)).gt(1944000 * 1e9)) {
            throw new Error('voting time range cannot over a month @' + deadline)
        }
        let choices = ['yes', 'no'];
        let rule = storage.globalMapGet(_Hub, 'rule', gsymbol);
        blockchain.callWithAuth(contract, 'create', [JSON.stringify(member), JSON.stringify(choices), rule]);
        let running = JSON.parse(storage.globalMapGet(_Hub, 'running_voting', gsymbol));
        if (running === null) {
            running = []
        }
        running.push(tx.hash);
        storage.mapPut('info', tx.hash, JSON.stringify({ theme, algo, deadline }));
        storage.mapPut('code', tx.hash, JSON.stringify({ action, options }));
        this._update('running_voting', gsymbol, JSON.stringify(running));
        return tx.hash
    }
    /**
     * 
     * @param {string} gsymbol 
     * @param {string} hash 
     */
    aggregate(gsymbol, hash) {
        let info = JSON.parse(storage.mapGet('info', hash));
        if (info === null) {
            throw new Error(hash + ': voting not found')
        }
        let deadline = new BigNumber(info.deadline);
        if (deadline.gt(tx.time)) {
            throw new Error(tx.time + ': deadline has not yet come')
        }
        let contract = storage.mapGet('algo', info.algo);
        let result = JSON.parse(blockchain.callWithAuth(contract, 'aggregate', [hash])[0]);
        let code = JSON.parse(storage.mapGet('code', hash));
        if (code !== null) {
            if (result.length === 1 && result[0] === 'yes') {
                let executable = JSON.parse(storage.globalMapGet(_Hub, 'executable', gsymbol));
                if (executable === null) {
                    executable = {}
                }
                executable[hash] = code;
                this._update('executable', gsymbol, JSON.stringify(executable));
            }
            storage.mapDel('code', hash)
        }
        let running = JSON.parse(storage.globalMapGet(_Hub, 'running_voting', gsymbol));
        let index = running.indexOf(hash);
        running.splice(index, 1);
        let finished = JSON.parse(storage.globalMapGet(_Hub, 'finished_voting', gsymbol));
        if (finished === null) {
            finished = {}
        }
        finished[hash] = tx.hash;
        this._update('running_voting', gsymbol, JSON.stringify(running));
        this._update('finished_voting', gsymbol, JSON.stringify(finished));
        storage.mapDel('info', hash);
        return JSON.stringify(result)
    }
    /**
     * 
     * @param {string} gsymbol 
     * @param {string} hash 
     */
    execute(gsymbol, hash) {
        let executable = JSON.parse(storage.globalMapGet(_Hub, 'executable', gsymbol));
        if (executable === null) {
            throw new Error('executable code not found @' + hash)
        }
        let code = executable[hash];
        if (code === undefined) {
            throw new Error('executable code not found @' + hash)
        }
        this._notifyListeners('execute', { gsymbol, code });
        delete executable[hash];
        this._update('executable', gsymbol, JSON.stringify(executable));
        if (code.action === 'create') {
            if (typeof code.option.minSupportRate !== 'number') {
                throw new Error('min support rate require number @' + code.option.minSupportRate)
            }
            if (typeof code.option.minVotingRate !== 'number') {
                throw new Error('min voting rate require number @' + code.option.minVotingRate)
            }
            storage.mapPut('rule', code.gsymbol, JSON.stringify({
                minSupportRate: code.option.minSupportRate,
                minVotingRate: code.option.minVotingRate
            }));
        } else if (code.action === 'dissolution') {
            storage.mapDel('rule', gsymbol);
            let running = JSON.parse(storage.globalMapGet(_Hub, 'running_voting', gsymbol));
            if (running !== null) {
                running.forEach(hash => {
                    let info = JSON.parse(storage.mapGet('info', hash));
                    let contract = storage.mapGet('algo', info.algo);
                    blockchain.callWithAuth(contract, 'cancel', [hash]);
                    storage.mapDel('info', hash);
                    storage.mapDel('code', hash);
                })
            }
            storage.mapDel('rule', gsymbol);
            this._update('running_voting', gsymbol);
            this._update('finished_voting', gsymbol);
            this._update('executable', gsymbol)
        }
    }
    /**
     * 
     * @param {string} subject 
     * @param {string} field 
     * @param {string} value 
     */
    _update(subject, field, value) {
        storage.put('update', JSON.stringify({ subject, field, value }));
        blockchain.call(_Hub, 'updateSubject', [subject]);
        storage.del('update');
    }
    /**
     * 
     * @param {string} event 
     * @param {string} message 
     */
    _notifyListeners(event, message) {
        storage.put('notification', JSON.stringify({ event, message }));
        blockchain.call(_Hub, 'notifyListeners', [event]);
        storage.del('notification');
    }
}
module.exports = Spoke;