/**
 * LiquidDemocracy for IOST
 * Copyright (C) 2019 PHI Inc.
 * ContractGiu8ZfUdtmjAVbnNXxarYHvjLstDaV26FQdj6SZhn8ff
 */
const _Hub = 'Contract8VfwmDLkrwZV6D915KaRoA27ZwadrAQ1p68egY25nfYy';
const _Voting = 'ContractCUEdCrGiHP2yy3be8rLaN5A43ff6xRBsbTsB7yWDVWFa';
const _symbol = 'gkyc01';
class LiquidDemocracy {
    init() {
        blockchain.callWithAuth(_Voting, 'addAlgo', ['liquid', blockchain.contractName()])
    }
    can_update(data) {
        return true
    }
    /**
     * 
     * @param {string} member 
     * @param {string} choices 
     * @param {string} rule 
     */
    create(member, choices, rule) {
        if (!blockchain.requireAuth(_Voting, 'active')) {
            throw new Error('permission denied @' + _Voting)
        }
        if (storage.mapHas('rule', tx.hash)) {
            throw new Error('already exist @' + tx.hash)
        }
        rule = JSON.parse(rule);
        let minSupportRate = rule.minSupportRate;
        let minVotingRate = rule.minVotingRate;
        storage.mapPut('rule', tx.hash, JSON.stringify({
            minSupportRate: new BigNumber(minSupportRate).div(100),
            minVotingRate: new BigNumber(minVotingRate).div(100)
        }));
        storage.mapPut('member', tx.hash, member);
        storage.mapPut('choices', tx.hash, choices);
        storage.mapPut('vote', tx.hash, JSON.stringify({}));
        storage.mapPut('delegate', tx.hash, JSON.stringify({}));
    }

    /**
     * direct vote
     * @param {string} hash transaction hash of voting creation
     * @param {string} gid 
     * @param {string} choice 
     */
    vote(hash, gid, choice) {
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
        let member = JSON.parse(storage.mapGet('member', hash));
        if (member.indexOf(gid) === -1) {
            throw new Error(gid + ': not voter')
        }
        let choices = JSON.parse(storage.mapGet('choices', hash));
        let index = choices.indexOf(choice);
        if (index === -1) {
            throw new Error(choice + ': choice not found');
        }
        let vote = JSON.parse(storage.mapGet('vote', hash));
        let delegate = JSON.parse(storage.mapGet('delegate', hash));
        // add vote data and remove delegate data
        vote[gid] = index;
        delete delegate[gid];
        storage.mapPut('vote', hash, JSON.stringify(vote));
    }

    /**
     * delegate
     * @param {string} hash transaction hash of voting creation
     * @param {string} from_gid 
     * @param {string} to_gid 
     */
    delegate(hash, from_gid, to_gid) {
        let tokenID = storage.globalMapGet(_Hub, 'tokenID', from_gid);
        let from = blockchain.call('token721.iost', 'ownerOf', [_symbol, tokenID])[0];
        if (!blockchain.requireAuth(from, 'active')) {
            throw new Error('permission denied @' + from)
        }
        let member = JSON.parse(storage.mapGet('member', hash));
        if (member.indexOf(from_gid) === -1) {
            throw new Error(from_gid + ': not voter')
        }
        if (member.indexOf(to_gid) === -1) {
            throw new Error(to_gid + ': not voter')
        }
        let vote = JSON.parse(storage.mapGet('vote', hash));
        let delegate = JSON.parse(storage.mapGet('delegate', hash));
        // add delegate data and remove vote data
        delete vote[from_gid];
        delegate[from_gid] = to_gid;
        // check delegate loop 
        let chain = [];
        let next = to_gid;
        while (next !== undefined) {
            if (chain.indexOf(next) !== -1) {
                throw new Error(next + ': loop delegate');
            }
            chain.push(next);
            next = delegate[next];
        }
        storage.mapPut('vote', hash, JSON.stringify(vote));
        storage.mapPut('delegate', hash, JSON.stringify(delegate));
    }

    /**
     * 
     * @param {string} hash transaction hash of voting creation
     * @param {string} from_gid who delegated to me
     */
    accept(hash, from_gid) {
        let vote = JSON.parse(storage.mapGet('vote', hash));
        let delegate = JSON.parse(storage.mapGet('delegate', hash));
        let to_gid = delegate[from_gid];
        let tokenID = storage.globalMapGet(_Hub, 'tokenID', to_gid);
        let to = blockchain.call('token721.iost', 'ownerOf', [_symbol, tokenID])[0];
        if (!blockchain.requireAuth(to, 'active')) {
            throw new Error('permission denied @' + to)
        }
        // add vote data
        vote[from_gid] = to_gid;
        // check delegate loop 
        let chain = [];
        let next = delegate[from_gid];
        while (next !== undefined) {
            if (chain.indexOf(next) !== -1) {
                throw new Error(next + ': loop delegate');
            }
            chain.push(next);
            next = delegate[next];
        }
        storage.mapPut('vote', hash, JSON.stringify(vote));
    }

    /**
     * 
     * @param {string} hash transaction hash of voting creation
     */
    aggregate(hash) {
        if (!blockchain.requireAuth(_Voting, 'active')) {
            throw new Error('permission denied @' + _Voting)
        }
        let rule = JSON.parse(storage.mapGet('rule', hash));
        let member = JSON.parse(storage.mapGet('member', hash));
        let choices = JSON.parse(storage.mapGet('choices', hash));
        let vote = JSON.parse(storage.mapGet('vote', hash));
        let delegate = JSON.parse(storage.mapGet('delegate', hash));
        let valid = {};
        let invalid = [];
        // valid vote num
        let n = 0;
        choices.forEach(content => {
            valid[content] = [];
        });
        // recursive function
        const clawl = (to) => {
            if (typeof vote[to] === 'string') {
                vote[to] = clawl(vote[to]);
            }
            return vote[to];
        }
        // result is number => valid, is not number => invalid
        for (let guildID in vote) {
            let r = clawl(guildID);
            if (typeof r === 'number') {
                valid[choices[r]].push(guildID);
                n++;
            } else {
                invalid.push(guildID);
            }
        }
        let votingRate = new BigNumber(n).div(member.length);
        // param for check
        let result = [];
        let max = 0;
        // voting rate check
        if (votingRate.gte(rule.minVotingRate)) {
            // most supported choice
            for (let content in valid) {
                let amount = valid[content].length;
                if (amount === max) {
                    result.push(content);
                } else if (amount > max) {
                    result = [content];
                    max = amount;
                }
            }
            // check support rate
            let supportRate = new BigNumber(max).div(n);
            if (supportRate.lt(rule.minSupportRate)) {
                result = [];
            }
        }
        storage.mapDel('rule', hash);
        storage.mapDel('member', hash);
        storage.mapDel('choices', hash);
        storage.mapDel('vote', hash);
        storage.mapDel('delegate', hash);
        blockchain.receipt(JSON.stringify({ result, info: { rule, member, choices, vote, delegate } }));
        return JSON.stringify(result);
    }

    /**
     * result of user vote at the moment 
     * @param {string} hash transaction hash of voting creation
     * @param {string} guildID 
     */
    resultOf(hash, guildID) {
        let vote = JSON.parse(storage.mapGet('vote', hash));
        const clawl = (to) => {
            if (typeof vote[to] === 'string') {
                vote[to] = clawl(vote[to]);
            }
            return vote[to];
        }
        let result = clawl(guildID);
        if (typeof result === 'number') {
            let choices = JSON.parse(storage.mapGet('choices', hash));
            return choices[result];
        }
    }
    /**
     * 
     * @param {string} hash 
     */
    cancel(hash) {
        if (!blockchain.requireAuth(_Voting, 'active')) {
            throw new Error('permission denied @' + _Voting)
        }
        storage.mapDel('rule', hash);
        storage.mapDel('member', hash);
        storage.mapDel('choices', hash);
        storage.mapDel('vote', hash);
        storage.mapDel('delegate', hash);
    }
}
module.exports = LiquidDemocracy;