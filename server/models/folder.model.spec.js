'use strict';

var should = require('should'),
    assert = require('assert'),    models = require('./index'),
    User = models.User,
    Folder = models.Folder,
    FolderItem = models.FolderItem,
    Promise = models.Sequelize.Promise;

var rootFolder = 
{
    name: 'ROOT',
    hierarchyLevel: 1,
    parentId: null
};

function getRootFolder (user) {
    return Folder.find({where: {
        name: 'ROOT',
        hierarchyLevel: 1,
        parentId: null,
        UserUserName: user
    }})
};

describe('Folder Model Unit Tests', function() {
    var testUserName = 'testuserfolder';
    var otherUserName = 'testotheruserfolder'
    var testUser = {};
    var otherUser = {};


    before(function (done) {
        User.sync()
        .then(function() {
            return Folder.sync();
        })
        .then(function() {
            return FolderItem.sync();
        })
        .then(function () {
            return User.destroy( {
                where: {username: testUserName}
            });
        })
        .then(function () {
            return User.create({
                username: testUserName
            });
        })
        .then(function(user) {
            testUser = user;
            return testUser.createFolder(rootFolder)
        })
        .then(function() {
            done();
        })
        .catch (function(err) {
            done(err);
        });
    });

    it('should find ROOT folder for testuserfolder', function(done) {
        testUser.should.be.Object();
        testUser.getFolders.should.be.Function();
        testUser.getFolders({where: rootFolder})
        .then(function(folders) {
            assert.notEqual(folders, null);
            folders.length.should.be.exactly(1);
            folders[0].getDataValue('name').should.equal('ROOT');
            done();
        })
        .catch(function(err) {
            done(err);
        });
    });

    it('should get a list of folders for one user', function(done) {
        Folder.find({
            where: rootFolder,
            include: [FolderItem]
        })
        .then(function(folder) {
            assert.notEqual(folder, null);
            done();
        })
        .catch(function(err) {
            done(err);
        });
    });

    it('should create a ROOT folder if it does not exist', function(done) {
        testUser
        .getFolders({where: rootFolder})
        .then(function(folders) {
            return folders[0].destroy();
        })
        .then(function() {
            return Folder.findOrCreate({where: rootFolder});
        })
        .spread(function(folder, created) {
            created.should.be.true();
        })
        .then(function() {
            done();
        })
        .catch(function(err) {
            done(err);
        });
    });

    it('should find the ROOT folder if it exists', function(done){
        Folder.findOrCreate({where: 
            {
                UserUserName: testUserName,
                name: 'ROOT',
                hierarchyLevel: 1
            }
        })
        .spread(function(folder, created) {
            created.should.be.false();
            done();
        })
        .catch(function(err) {
            done(err);
        });
    });

    it('should return a list of the user folders and folder items', function(done) {
        getRootFolder(testUserName)
        .then(function(folder) {
            return Promise.each([
                {elasticId: 'id1'},
                {elasticId: 'id2'}
            ], function(item) {
                return folder.createFolderItem(item);
            })
        })
        .then(function () {
            return testUser.getFolders({include: [FolderItem]});
        })
        .then(function(folders) {
            assert.notEqual(folders, null);
            folders.length.should.be.above(0);
            folders[0].FolderItems.length.should.be.exactly(2);
            console.log(JSON.stringify(folders));
        })
        .then(function(results) {
            done();
        })
        .catch(function(err) {
            done(err);
        });
    });

    it('should not allow more than one ROOT folder per user');

    it('should not allow users to share same ROOT folder')

    it('should find the correct ROOT folder')

});
