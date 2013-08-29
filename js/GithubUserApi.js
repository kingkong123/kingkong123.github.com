/*
 * GitHubUserApi.js
 * version 1.0.0
 * jQuery Plugin
 * by kingkong123 (http://kingkong123.github.io/)
 * MIT License
 */
 
(function ( $ ) {
	$.GithubUserApi = function( options ) {
		var $scope = this;
		var opts = {}, langs = {};

		var userInfo = { success: false, data: {}, message: '' },
			allRepos = { success: false, data: [], message: '' },
			allLangs = { success: false, process: false, parsedRepo: 0, data: {}, message: '' };

		var API_URL = 'https://api.github.com/';

		var user_info_uri = 'users/:user';
		var user_repos_uri = 'users/:user/repos';
		var repo_langs_uri = 'repos/:user/:repo/languages';

		var defaultSort = [];
		var langRepos = 0;

		var defaults = {
			user: '',
			repoType: 'all', // all, owner, public, private, member
			repoSort: 'full_name', // created, updated, pushed, full_name
			repoDirection: 'asc', // asc, desc

			langSort: 'name', // name, size
			langDirection: 'asc', // asc, desc
		};

		var REPO_TYPES = ['all', 'owner', 'public', 'private', 'member'];
		var REPO_DEFAULT_SORTS = ['created', 'updated', 'pushed', 'full_name'];

		var DIRECTIONS = ['asc', 'desc'];

		var REPO_CUSTOM_SORTS = ['forks', 'watchers', 'open_issues', 'size'];

		var LANG_SORTS = ['name', 'size'];

		var getJson = function(url){
			return $.getJSON(url, function(data){});
		}

		var getUserInfoURL = function(user){
			return API_URL+'users/'+user;
		}
		var getAllReposURL = function(user){
			var getQuery = '';
			var getQueryArray = [];

			if((opts.repoType != defaults.repoType) && (REPO_TYPES.indexOf(opts.repoType) > -1)){
				getQueryArray.push('type='+opts.repoType);
			}

			if((opts.repoSort != defaults.repoSort) && (REPO_DEFAULT_SORTS.indexOf(opts.repoSort) > -1)){
				getQueryArray.push('sort='+opts.repoSort);
			}

			if((opts.repoDirection != defaults.repoDirection) && (DIRECTIONS.indexOf(opts.repoDirection) > -1)){
				getQueryArray.push('direction='+opts.repoDirection);
			}else if(DIRECTIONS.indexOf(opts.repoDirection) == -1){
				opts.repoDirection = defaults.repoDirection;
			}

			if(getQueryArray.length > 0){
				getQuery = '?'+getQueryArray.join('&');
			}


			return API_URL+'users/'+user+'/repos'+getQuery;
		}
		var getRepoLangsURL = function(user, name){
			return API_URL+'repos/'+user+'/'+name+'/languages';
		}

		this.init = function(options){
			opts = $.extend( {}, defaults, options );

			return this;
		};

		this.getUserInfo = function(callback){
			if(!userInfo.success){
				var url = getUserInfoURL(opts.user);
				var userInfoJson = getJson(url);

				userInfoJson.complete(function(data){
					//console.log(data);
					if(data.status == 200){
						userInfo.success = true;
						userInfo.data = data.responseJSON;

						if( $.isFunction(callback) ){
							return callback(userInfo);
						}else{
							return { success: false, message: 'Callback function not exists' };
						}
					}else{
						userInfo.message = 'Fail to connect to server, please retry.';
						return userInfo;
					}
				});
			}else{
				return callback(userInfo.data);
			}
		}

		this.getAllRepos = function(callback1, callback2){
			if(!allRepos.success){
				var url = getAllReposURL(opts.user);
				var allReposJson = getJson(url);

				allReposJson.complete(function(data){
					//console.log(data);
					if(data.status == 200){
						if((opts.repoSort != defaults.repoSort) && (REPO_CUSTOM_SORTS.indexOf(opts.repoSort) > -1)){
							data.responseJSON.sort( $scope.customSort(opts.repoSort, opts.repoDirection) );
						}

						//console.log(data);
						allRepos.success = true;
						allRepos.data = data.responseJSON;
						
						if( $.isFunction(callback1) ){
							if( callback2 != null ){
								return callback1(callback2);
							}else{
								return callback1(allRepos);
							}
						}else{
							return { success: false, message: 'Callback function not exists' };
						}
					}else{
						allRepos.message = 'Fail to connect to server, please retry.';
						return allRepos;
					}
				});
			}else{
				if( callback2 != null ){
					return callback1(callback2);
				}else{
					return callback1(allRepos);
				}
			}
		}

		var getAllReposLength = function(){
			var i = 0;

			if(allRepos.success){
				$.each(allRepos.data, function(idx, val){
					i++;
				});

				return i;
			}

			return 0;
		}

		var getParsedRepo = function(){
			return allLangs.parsedRepo;
		}
		var updateParsedRepo = function(i){
			allLangs.parsedRepo = i;
		}
		var updateLangs = function(data){
			$.each(data, function(idx, val){
				//console.log(idx+" - "+val);
				if( typeof(langs[idx]) == 'undefined' ){
					langs[idx] = val;
				}else{
					langs[idx] += val;
				}
			});
			//console.log(langs);
		}

		var checkLangsCompleted = function(callback){
			if(getParsedRepo() == langRepos && allLangs.process && !allLangs.success){
				var newLang = [];

				$.each(langs, function(idx, val){
					newLang.push({ name: idx, size: val });
				});

				allLangs.success = true;
				allLangs.data = newLang;
				return $scope.getAllLangs(callback);
			}
		}

		this.getAllLangs = function(callback){
			if(!allRepos.success){
				this.getAllRepos(this.getAllLangs, callback);
			}else{
				if(!allLangs.success && !allLangs.process){
					langRepos = getAllReposLength();

					$.each(allRepos.data, function(idx, val){
						//console.log(val);

						var url = getRepoLangsURL(opts.user, val.name);
						var langJson = getJson(url);

						langJson.complete(function(data){
							if(data.status == 200){
								var parsedRepo = getParsedRepo();
								updateParsedRepo(parsedRepo +1);

								updateLangs(data.responseJSON);

								return checkLangsCompleted(callback);
							}else{
								allRepos.message = 'Fail to connect to server, please retry.';
								return callback(allLangs);
							}
						});
					});

					allLangs.process = true;
				}else if(!allLangs.success && allLangs.process){
					return this.getAllLangs(callback);
				}else if( allLangs.success && allLangs.process && langRepos == getParsedRepo() ){
					if( $.isFunction(callback) ){
						if( (LANG_SORTS.indexOf(opts.langSort) > -1) && (DIRECTIONS.indexOf(opts.langDirection) > -1) ){
							allLangs.data.sort( $scope.customSort(opts.langSort, opts.langDirection) );
						}else if( (LANG_SORTS.indexOf(opts.langSort) == -1) && (DIRECTIONS.indexOf(opts.langDirection) > -1) ){
							allLangs.data.sort( $scope.customSort(defaults.langSort, opts.langDirection) );
						}else if( (LANG_SORTS.indexOf(opts.langSort) > -1) && (DIRECTIONS.indexOf(opts.langDirection) == -1) ){
							allLangs.data.sort( $scope.customSort(opts.langSort, defaults.langDirection) );
						}

						return callback(allLangs);
					}else{
						return { success: false, message: 'Callback function not exists' };
					}
				}
			}
		}

		this.customSort = function(field, direction) {
		    var sortOrder = 1;
		    if(direction === "desc") {
		        sortOrder = -1;
		    }

		    return function (a,b) {
		        var result = (a[field] < b[field]) ? -1 : (a[field] > b[field]) ? 1 : 0;
		        return result * sortOrder;
		    }
		}
		
		return this.init(options);
	};
}( jQuery ));