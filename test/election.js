const Election = artifacts.require("./Election.sol");

contract("Election", accounts => {
  let electionInstance;

  it("initializes with two candidates", () => {
    return Election.deployed()
      .then(instance => instance.candidatesCount())
      .then(count => assert.equal(count, 2));
  });

  it("initializes id, name, vote count", () => {
    return Election.deployed()
      .then(instance => {
        electionInstance = instance;
        return electionInstance.candidates(1);
      })
      .then(candidate => {
        assert.equal(candidate[0], 1, "id");
        assert.equal(candidate[1], "Candidate 1", "name");
        assert.equal(candidate[2], 0, "vote count");
        return electionInstance.candidates(2);
      })
      .then(candidate => {
        assert.equal(candidate[0], 2, "id");
        assert.equal(candidate[1], "Candidate 2", "name");
        assert.equal(candidate[2], 0, "vote count");
      });
  });

  it("can vote", () => {
    const candidateId = 1;
    const accountId = 1;
    return Election.deployed()
      .then(instance => {
        electionInstance = instance;
        return electionInstance.vote(candidateId, {
          from: accounts[accountId]
        });
      })
      .then(receipt => electionInstance.voters(accounts[accountId]))
      .then(voted => {
        assert(voted, "has voted");
        return electionInstance.candidates(candidateId);
      })
      .then(candidate =>
        assert.equal(candidate[2].toNumber(), 1, "vote was counted")
      );
  });

  it("no voting twice", () => {
    const candidateId = 1;
    const accountId = 2;
    return Election.deployed()
      .then(instance => {
        electionInstance = instance;
        return electionInstance.vote(candidateId, {
          from: accounts[accountId]
        });
      })
      .then(receipt =>
        electionInstance.vote(candidateId, {
          from: accounts[accountId]
        })
      )
      .then(voted => assert(false, "did not see exception for voting twice"))
      .catch(e => assert(e.message.indexOf("revert") >= 0, e.message));
  });

  it("no voting for invalid candidates", () => {
    return Election.deployed()
      .then(instance => {
        electionInstance = instance;
        return electionInstance.vote(0);
      })
      .then(receipt =>
        assert.isOk(false, "did not see candidate lower bound exception")
      )
      .catch(e => {
        assert.isOk(e.message.indexOf("revert") >= 0, e.message);
        return electionInstance.candidatesCount();
      })
      .then(count => electionInstance.vote(count + 1))
      .then(voted =>
        assert.isOk(false, "did not see candidate upper bound exception")
      )
      .catch(e => assert.isOk(e.message.indexOf("revert") >= 0, e.message));
  });

  it("verify voting event", () => {
    const candidateId = 1;
    return Election.deployed()
      .then(instance => {
        electionInstance = instance;
        return electionInstance.vote(candidateId, {
          from: web3.eth.accounts[3]
        });
      })
      .then(receipt => {
        assert(receipt.logs.length, 1, "saw an event");
        assert(receipt.logs[0].event, "votedEvent", "saw the correct event");
        assert(
          receipt.logs[0].args._candidateId,
          candidateId,
          "saw the correct event"
        );
      })
      .catch(e => console.log(e.message));
  });
});
