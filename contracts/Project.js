const _Hub = 'Contract8VfwmDLkrwZV6D915KaRoA27ZwadrAQ1p68egY25nfYy';
const _subjects = ['member', 'rule'];
const _events = ['member'];
const _listeners = ['execute'];
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
     * @param {string} gsymbol 
     * @param {string} publisherGid 
     * @param {string} initialMember 
     * @param {string} config 
     */
    createProject(gsymbol, publisherGid, initialMember, config) {
        let publisherTokenID = storage.globalMapGet(_Hub, 'tokenID', publisherGid);
        if (publisherTokenID === null) {
            throw new Error('gid not found @' + publisherGid)
        }
        let publisher = blockchain.call('token721.iost', 'ownerOf', [_symbol, publisherTokenID])[0];
        if (publisher === null) {
            throw new Error('gid not found' + gid)
        }
        if (!blockchain.requireAuth(publisher, 'active')) {
            throw new Error('permission denied @' + publisher)
        }
        blockchain.callWithAuth('token721.iost', 'create', [gsymbol, blockchain.contractName(), 50]);
        initialMember = JSON.parse(initialMember);
        let l = [publisherGid];
        initialMember.forEach(gid => {
            if (l.indexOf(gid) !== -1) {
                throw new Error('duplicate gid @' + gid)
            }
            l.push(gid)
        });
        initialMember.forEach(gid => {
            let tokenID = storage.globalMapGet(_Hub, 'tokenID', gid);
            if (tokenID === null) {
                throw new Error('gid not found @' + gid)
            }
            let owner = blockchain.call('token721.iost', 'ownerOf', [_symbol, tokenID])[0];
            if (owner === null) {
                throw new Error('gid owner not found' + gid)
            }
        });
        this._update('member', gsymbol, JSON.stringify({
            member: [publisherGid],
            invite: initialMember
        }));
        this._update('rule', gsymbol, config);
        this._notifyListeners('member', {
            gsymbol,
            action: 'create',
            option: JSON.parse(config)
        });
        this._notifyListeners('member', {
            gsymbol,
            action: 'join',
            option: publisherGid
        })
        this._notifyListeners('member', {
            gsymbol,
            action: 'invite',
            option: initialMember
        })
    }
    /**
     * 
     * @param {string} gsymbol 
     * @param {string} gid 
     */
    join(gsymbol, gid) {
        let tokenID = storage.globalMapGet(_Hub, 'tokenID', gid);
        if (tokenID === null) {
            throw new Error('gid not found @' + gid)
        }
        let publisher = blockchain.call('token721.iost', 'ownerOf', [_symbol, tokenID])[0];
        if (publisher === null) {
            throw new Error('gid not found' + gid)
        }
        if (!blockchain.requireAuth(publisher, 'active')) {
            throw new Error('permission denied @' + publisher)
        }
        let member = JSON.parse(storage.globalMapGet(_Hub, 'member', gsymbol));
        if (member === null) {
            throw new Error('member not found @' + gsymbol)
        }
        if (member.member.indexOf(gid) !== -1) {
            throw new Error('already member')
        }
        let rule = JSON.parse(storage.globalMapGet(_Hub, 'rule', gsymbol));
        let index = member.invite.indexOf(gid);
        if (rule.freeJoin !== true) {
            if (index === -1) {
                throw new Error('not invited')
            }
        }
        if (index !== -1) {
            member.invite.splice(index, 1)
        }
        member.member.push(gid);
        this._update('member', gsymbol, JSON.stringify(member));
        this._notifyListeners('member', {
            gsymbol,
            action: 'join',
            option: gid
        })
    }
    /**
     * 
     * @param {string} gsymbol 
     * @param {string} gid 
     */
    quit(gsymbol, gid) {
        let tokenID = storage.globalMapGet(_Hub, 'tokenID', gid);
        if (tokenID === null) {
            throw new Error('gid not found @' + gid)
        }
        let publisher = blockchain.call('token721.iost', 'ownerOf', [_symbol, tokenID])[0];
        if (publisher === null) {
            throw new Error('gid not found' + gid)
        }
        if (!blockchain.requireAuth(publisher, 'active')) {
            throw new Error('permission denied @' + publisher)
        }
        let member = JSON.parse(storage.globalMapGet(_Hub, 'member', gsymbol));
        if (member === null) {
            throw new Error('member not found @' + gsymbol)
        }
        let index = member.member.indexOf(gid);
        if (index === -1) {
            throw new Error('not invited')
        }
        member.member.splice(index, 1);
        this._update('member', gsymbol, JSON.stringify(member));
        this._notifyListeners('member', {
            gsymbol,
            action: 'quit',
            option: gid
        })
    }
    /**
     * 
     * @param {string} message 
     */
    _executeListener(message) {
        if (message.code.action === 'invite') {
            if (!storage.globalMapHas(_Hub, 'tokenID', message.code.options)) {
                throw new Error('guild id not found @' + message.code.options)
            }
            let member = JSON.parse(storage.globalMapGet(_Hub, 'member', message.gsymbol));
            if (member.invite.indexOf(message.code.gid) !== -1) {
                throw new Error('already invited')
            }
            if (member.member.indexOf(message.code.gid) !== -1) {
                throw new Error('already member')
            }
            member.invite.push(message.code.options);
            this._update('member', message.gsymbol, JSON.stringify(member));
            // this._notifyListeners('member', {
            //     gsymbol: message.gsymbol,
            //     action: 'invite'
            // })
        } else if (message.code.action === 'dissolution') {
            this._update('member', message.gsymbol);
            this._update('rule', message.gsymbol);
            // re-entering error
            // this._notifyListeners('member', {
            //     gsymbol: message.gsymbol,
            //     action: 'dissolution'
            // });
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