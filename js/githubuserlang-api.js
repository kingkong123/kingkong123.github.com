(function ( $ ) {
	$.githubuserlang = function( options ) {
		var $scope = this;
		var opts = {}, langs = {};
		var completed = false;

		var userInfo = { success: false, completed: false, data: {}, message: '' },
			allRepos = { success: false, completed: false, data: [], message: '' },
			allLangs = { success: false, completed: false, process: false, parsedRepo: 0, data: {}, message: '' };

		var API_URL = 'https://api.github.com/';

		var user_info_uri = 'users/:user';
		var user_repos_uri = 'users/:user/repos';
		var repo_langs_uri = 'repos/:user/:repo/languages';

		var langRepos = 0;

		var defaults = {
			user: '',
			
			//sort: "full_name", // created, updated, pushed, full_name
			//direction: 'asc'
		};

		var getJson = function(url){
			return $.getJSON(url, function(data){});
		}

		var getUserInfoURL = function(user){
			return API_URL+'users/'+user;
		}
		var getAllReposURL = function(user){
			return API_URL+'users/'+user+'/repos';
		}
		var getRepoLangsURL = function(user, name){
			return API_URL+'repos/'+user+'/'+name+'/languages';
		}

		this.init = function(options){
			opts = $.extend( {}, defaults, options );

			return this;
		};

		this.getCompleted = function(){
			return completed;
		}

		this.getUserInfo = function(callback){
			if(!userInfo.success){
				var url = getUserInfoURL(opts.user);
				var userInfoJson = getJson(url);

				userInfoJson.complete(function(data){
					console.log(data);
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

		this.getAllRepos = function(callback){
			if(!allRepos.success){
				var url = getAllReposURL(opts.user);
				var allReposJson = getJson(url);

				allReposJson.complete(function(data){
					console.log(data);
					if(data.status == 200){
						allRepos.success = true;
						allRepos.data = data.responseJSON;
						
						if( $.isFunction(callback) ){
							return callback(allRepos);
						}else{
							return { success: false, message: 'Callback function not exists' };
						}
					}else{
						allRepos.message = 'Fail to connect to server, please retry.';
						return allRepos;
					}
				});
			}else{
				return callback(allRepos);
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
				console.log(idx+" - "+val);
				if( typeof(langs[idx]) == 'undefined' ){
					langs[idx] = val;
				}else{
					lags[idx] += val;
				}
			});
		}

		var checkLangsCompleted = function(callback){
			if(getParsedRepo() == langRepos && allLangs.process && !allLangs.success){
				allLangs.success = true;
				allLangs.data = langs;
				return $scope.getAllLangs(callback);
			}
		}

		this.allLangCallback = null;

		this.getAllLangs = function(callback){
			this.allLangCallback = callback;
			
			if(!allRepos.success){
				this.getAllRepos(this.getAllLangs);
			}else{
				if(!allLangs.success && !allLangs.process){
					langRepos = getAllReposLength();

					$.each(allRepos.data, function(idx, val){
						console.log(val);

						var url = getRepoLangsURL(opts.user, val.name);
						var langJson = getJson(url);

						langJson.complete(function(data){
							//console.log(data);
							if(data.status == 200){
								var parsedRepo = getParsedRepo();
								updateParsedRepo(parsedRepo +1);

								updateLangs(data.responseJSON);

								return checkLangsCompleted($scope.allLangCallback);
							}else{
								allRepos.message = 'Fail to connect to server, please retry.';
								return $scope.allLangCallback(allLangs);
							}
						});
					});

					allLangs.process = true;
				}else if(!allLangs.success && allLangs.process){
					return this.getAllLangs(this.allLangCallback);
				}else if( allLangs.success && allLangs.process && langRepos == getParsedRepo() ){
					if( $.isFunction(this.allLangCallback) ){
						return this.allLangCallback(allLangs);
					}else{
						return { success: false, message: 'Callback function not exists' };
					}
				}
			}
		}

		this.getOpts = function(){
			return opts;
		};
		
		return this.init(options);
	};
}( jQuery ));