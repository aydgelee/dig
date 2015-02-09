'use strict';

describe('Controller: SearchResultsCtrl', function () {

    // load the controller's module
    beforeEach(module('digApp'));

    var SearchCtrl, scope, state;

    // Initialize the controller and a mock scope
    beforeEach(function() {
        var simHost = 'http://localhost';
        var $httpBackend;

        module(function($provide) {
            $provide.constant('simHost', simHost);
            $provide.constant('euiSearchIndex', 'dig');
            $provide.constant('euiConfigs', {
                facets: [],
                listFields: [],
                detailsFields: []
            });
        });

        inject(function ($controller, $rootScope, $state, _$httpBackend_) {
            scope = $rootScope.$new();
            state = $state;
            state.current.name = 'search.results.list';
            spyOn(state, 'go');

            $httpBackend = _$httpBackend_;
            $httpBackend.when('GET', new RegExp('app/search/search.html'))
                .respond(200, 'some text');
            $httpBackend.when('GET', new RegExp('app/search/search-results/list/list.partial.html'))
                .respond(200, 'some text');
            $httpBackend.when('GET', new RegExp('app/search/search-results/gallery/gallery.partial.html'))
                .respond(200, 'some text');
            $httpBackend.when('GET', new RegExp('app/search/search-results/details/details.html'))
                .respond(200, 'some text');

            scope.indexVM = {
                filters: {
                    ejsFilters: []
                },
                loading: true,
                page: 1,
                query: 'someValue',
                pageSize: 10
            };

            SearchCtrl = $controller('SearchResultsCtrl', {
                $scope: scope,
                $state: state
            });

            scope.$digest();
        });
    });

    it('should not have scope.doc', function () {
        expect(scope.doc).toBe(undefined);
    });

    it('should update state to details view and add passed in doc to scope', function () {
        var testDoc = {name: 'TestDoc'};

        scope.viewDetails(testDoc);

        expect(scope.doc).not.toBeNull();
        expect(state.go).toHaveBeenCalledWith('search.results.details');
    });

    it('should update state from details to list view and null out scope.doc if scope.doc is set and previousState is not set', function () {
        scope.doc = {name: 'TestDoc'};

        scope.backToPreviousState();

        expect(scope.doc).toBeNull();
        expect(state.go).toHaveBeenCalledWith('search.results.list');
    });

    it('should update state from details to previous view and null out scope.doc if scope.doc is set and previousState is set', function () {
        scope.doc = {name: 'TestDoc'};
        scope.previousState = 'gallery';

        scope.backToPreviousState();

        expect(scope.doc).toBeNull();
        expect(state.go).toHaveBeenCalledWith('search.results.gallery');
    });

    it('should return whether or not a list item is opened by id', function() {
        expect(scope.isListItemOpened('foo')).toBe(false);

        scope.toggleListItemOpened('foo');
        expect(scope.isListItemOpened('foo')).toBe(true);

        scope.toggleListItemOpened('foo');
        expect(scope.isListItemOpened('foo')).toBe(false);
    });
});