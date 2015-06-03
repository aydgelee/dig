'use strict';

angular.module('digApp')
.controller('ResultsCtrl', ['$scope', '$state', '$sce', '$http', 'imageSearchService', 
    function($scope, $state, $sce, $http, imageSearchService) {
    $scope.opened = [];
    $scope.displayMode = {
        mode: 'list'
    };
    $scope.indexVM.pageSize = 25;
    $scope.selectedImage = 0;
    $scope.galleryItem = {};

    $scope.selectImage = function(index) {
        $scope.selectedImage = index;
    };

    $scope.stripHtml = function(data) {
        return $sce.trustAsHtml(String(data).replace(/<(?!\/?mark\s*\/?)[^>]+>/gm, ''));
    };

    $scope.viewDetails = function(doc, previousState) {
        $scope.doc = doc;
        $scope.previousState = previousState;
        if($scope.activeTab == $scope.FILTER_TAB) {
          $state.go('main.search.results.details');
        } else {
          $state.go('main.folder.results.details');
        }
    };

    $scope.backToPreviousState = function() {
        if($scope.doc) {
            $scope.doc = null;
            $scope.selectedImage = 0;
        }

        if($scope.previousState && $scope.previousState === 'gallery') {
            $scope.viewGallery();
        } else {
            $scope.viewList();
        }
    };

    $scope.viewGallery = function() {
        $scope.displayMode.mode = 'gallery';
        $state.go('main.search.results.gallery');
    };

    $scope.viewList = function() {
        $scope.clearGalleryItem();
        $scope.displayMode.mode = 'list';
        if($scope.activeTab == $scope.FILTER_TAB) {
          $state.go('main.search.results.list');
        } else {
          $state.go('main.folder.results.list');
        }
    };

    $scope.toggleListItemOpened = function(index) {
        $scope.opened[index] = !($scope.opened[index]);
    };

    $scope.isListItemOpened = function(index) {
        return ($scope.opened[index]) ? true : false;
    };

    $scope.toggleGalleryItemOpened = function(id, index) {
        $scope.galleryItem = {docId: id, docNum: index};
    };

    $scope.clearGalleryItem = function() {
        $scope.galleryItem = {};
    };

    $scope.isGalleryItemPopulated = function() {
        if($scope.galleryItem.docId) {
            return true;
        }
        return false;
    };

    $scope.isGalleryItemOpened = function(id) {
        return ($scope.isGalleryItemPopulated() && $scope.galleryItem.docId === id);
    };

    $scope.switchView = function(displayMode) {
        if(displayMode === 'list') {
            $scope.viewList();
        } else if(displayMode === 'gallery') {
            $scope.viewGallery();
        }
    };

    $scope.setImageSearchMatchIndices = function() {
        var doc = $scope.doc;
        var currentSearch, imgFeature;
        $scope.selectedImage = -1;
        $scope.imageMatchStates = [];

        /* jshint camelcase:false */
        // If we have an active image search and multiple image parts, check for a matching image.
        if (imageSearchService.getActiveImageSearch() && imageSearchService.getActiveImageSearch().enabled &&
            doc._source.hasFeatureCollection.similar_images_feature &&
            doc._source.hasImagePart.length > 0) {
            currentSearch = imageSearchService.getActiveImageSearch();
            imgFeature = _.find(doc._source.hasFeatureCollection.similar_images_feature,
                function(item) { return item.featureValue === currentSearch.url; });

            // Verify that the current search url is in the similar images feature.  If so, select the matching
            // image.
            if (imgFeature) {
                var imgObj = _.find(doc._source.hasFeatureCollection.similar_images_feature,
                    function(item) { return (typeof item.featureObject !== 'undefined'); });

                _.each(doc._source.hasImagePart, function(part, index) {
                    $scope.imageMatchStates[index] = _.contains(imgObj.featureObject.imageObjectUris, part.uri);
                    if ($scope.imageMatchStates[index] && $scope.selectedImage < 0) {
                        $scope.selectedImage = index;
                    }
                });
            }
        }
        /* jshint camelcase:true */

        // Set to selected index to 0 if no matches were found.
        $scope.selectedImage = ($scope.selectedImage >= 0) ? $scope.selectedImage : 0;
    };

    // Selects or deselects a doc from the list view when a checkbox is clicked
    $scope.updateSelectionList = function($event, doc) {
      $scope.updateSelection($event.target.checked, doc);
    };

    // Selects or deselects a doc based on the given doSelect boolean
    $scope.updateSelection = function(doSelect, doc) {
      // Select or deselect the doc
      if (doSelect && !$scope.isSelected(doc._id)) {
        $scope.selectedItems[$scope.selectedItemsKey].push(doc._id);
      } else if(!doSelect) {
        _.pull($scope.selectedItems[$scope.selectedItemsKey], doc._id);
      }
    };

    // Selects or deselects all docs on page when the global checkbox is clicked
    $scope.selectAll = function($event) {
      _.forEach($scope.indexVM.results.hits.hits, function(doc) {
        $scope.updateSelection($event.target.checked, doc);
      });
    };

    // Returns whether the doc with the id given is selected
    $scope.isSelected = function(id) {
      return (_.indexOf($scope.selectedItems[$scope.selectedItemsKey], id) != -1);
    };

    // Returns whether all docs on the current page are selected or not
    $scope.isSelectedAll = function() {
      if($scope.indexVM.results) {
        var allSelected = true;

        _.forEach($scope.indexVM.results.hits.hits, function(doc) {
          if(!$scope.isSelected(doc._id)) {
            allSelected = false;
          }
        });

        return allSelected;
      }

      return false;
    };

    // Gets the total numbers of docs selected on all pages
    $scope.getNumberSelected = function() {
      return ($scope.selectedItems[$scope.selectedItemsKey]) ? $scope.selectedItems[$scope.selectedItemsKey].length : 0;
    };

    // Moves selected docs to given folder
    $scope.moveItems = function(folder) {
      $http.put('api/folders/' + folder._id,
        {name: folder.name, parentId: folder.parentId, items: $scope.selectedItems[$scope.selectedItemsKey]}).
        success(function(data) {
          if($scope.selectedItemsKey != $scope.FILTER_TAB) {
            $scope.removeItems();
          }
        });
    };

    $scope.isDeleteDisabled = function() {
      if($scope.selectedItemsKey == $scope.FILTER_TAB) {
        return true;
      } else if($scope.selectedItems[$scope.selectedItemsKey]) {
        return !$scope.selectedItems[$scope.selectedItemsKey].length;
      } else {
        return true;
      }
    };

    $scope.$watch('indexVM.query', function(){
      if(!$scope.tabChange) {
        // Reset our opened document state and page on a new query.
        $scope.opened = [];
        $scope.galleryItem = {};
        $scope.indexVM.page = 1;
        $scope.selectedItems[$scope.selectedItemsKey] = [];
      }
      $scope.tabChange = false;
    });

    $scope.$watch(function() {
            return imageSearchService.getActiveImageSearch();
        }, function() {
            if ($scope.doc) {
                $scope.setImageSearchMatchIndices();
            }
        }, true);

}]);