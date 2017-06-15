(function ()
{
	this.HanoiSim = function ()
	{
		var defaults = 
		{
			number_disks 		: 3,
			container_class 	: "hanoi_wrapper",
			animation_duration	: 1000,
			tower_clutter		: [0, 0, 0],
			disks				: [[],[]],
			last_disk_moved 	: 0,
			finished_anim		: 1,
			container_width		: 80	// width of container in vw
		}
		self = this;
		this.options = defaults;

		Object.prototype.extend = function (obj)
		{
			for (var key in obj)
			{
				this[key] = obj[key];
			}
		} 
		// Check if arguments defined and if it  is the case, merge with defaults
		if (arguments[0] && typeof arguments[0] == "object")
		{
			this.options.extend(arguments[0]);
		}


		// Listener to reset simulation on window resize
		document.addEventListener('resize', function()
		{
			self.init();
		});
	}

	HanoiSim.prototype.init = function ()
	{
		// Create disks dynamically here
		var $container = document.querySelector('.'+self.options.container_class);
		var $disks = $container.querySelectorAll('.disk');
		var $disk_wrapper = $container.querySelector('disk_wrapper');
		var animation_chunk = self.options.animation_duration / 4000;
		var offsetXRatio = self.options.container_width / 3.333333333333333; 

		// Record dimensions of experiment
		var hgt_disk = $disks[0].height;
		var hgt_pole = document.querySelector('.hanoi_tower').height;

		// Initialize disks on the first tower by increasing size
		var length = $disks.length;
		self.options.disks = [[], []]
		var plts = [];
		var k = 1;
		while (k <= self.options.number_disks)
		{
			plts.push(k);
			k++;
		}

		self.options.tower_clutter = [self.options.number_disks, 0, 0]
		self.options.disks.unshift(plts);
		self.options.extend({container: $container , height_pole: hgt_pole, height_disk: hgt_disk, number_disks: length , offset_X_ratio: offsetXRatio});
		console.log(self.options.disks);
		for (var i = 0; i < $disks.length; i++)
		{
			self.updatedisk($disks[i].id, 1, length - i);
			// resetting position of disks
			$disks[i].style.transform = "translate(0,0)";

			$disks[i].style.transition = "all "+animation_chunk+"s linear";
			
		}	

	}

	HanoiSim.prototype.play = function ()
	{
		// Initialize sim
		self.init();

		hanoi.playEpoch();
		var latency = self.options.animation_duration;
		var game_turn = setInterval(function ()
			{	
				hanoi.playEpoch();
				if (self.options.disks[2].length >= self.options.number_disks)
				{
					console.log("+++++++++++++++++++++ DONE ++++++++++++++++++++++");
					clearInterval(game_turn);
					document.getElementById('start_sim').classList.remove('disable');
					document.getElementById('speed_sim').classList.remove('disable');
					document.getElementById('number_disks').classList.remove('disable');
				};
			}, latency);

	}

	HanoiSim.prototype.playEpoch = function ()
	{
		// Move one disk to given pole	
		var $container = self.options.container;
		var $disks = $container.querySelectorAll('.disk');

		var j = 0;
		// Looping over towers (starting with the leftmost tower)
		while (j < 3)
		{
			console.log('---starting----: ');
			console.log('current tower: '+j);
			console.log(self.options.disks);
			// If tower empty, go to the next one
			if (self.options.disks[j].length < 1)
			{
				j++;
				continue;
			}
			var curr_top_disk = self.options.disks[j][0];
			var top_disk_ind = self.options.disks[j][0] - 1; 
			var next_tower = self.find_next_valid_tower(top_disk_ind, j);
			console.log('curr top disk: '+ curr_top_disk);
			console.log('next valid tower: '+ next_tower);

			// avoid moving the same disk twice
			if (curr_top_disk == self.options.last_disk_moved)
			{
				j++;
				self.options.last_disk_moved = 0;
				continue;
			}
			// Move disk if dest tower != current tower
			if ( next_tower != j )
			{
				console.log('--- Initiating movement ---');
				self.moveOne(top_disk_ind, next_tower);
				self.options.disks[next_tower].unshift(curr_top_disk);
				self.options.disks[j].shift(curr_top_disk);
				console.log(self.options.disks);
				console.log('=======================================================')
				break;
			}
			j++;
			console.log('---->Continuing scan with new tower')
		}
	}

	HanoiSim.prototype.find_next_valid_tower = function (id_disk, current_tower)
	{
		console.log('moving disk #: '+(id_disk+1));
		// Move one disk to given pole
		var $container = self.options.container;
		var $disks = $container.querySelectorAll('.disk');

		// loop through towers until find one free or until loop back to original position
		var next_tower = current_tower
		var i = current_tower + 1;
		while ( i != current_tower )
		{
			if ( i >= 3)
			{
				i = 0;
			}
			// If a tower has a bigger disk than the curr disk or no disks, record valid choice and proceed to next step
			if ( self.options.disks[i][0] > id_disk || self.options.disks[i].length < 1)
			{
				next_tower = i;
				break;
			}
			i ++;
		}
		return next_tower;
	}

	HanoiSim.prototype.moveOne = function (id_disk, next_tower)
	{
		// Begin animation to next tower
		var $container = self.options.container;
		var $disks = $container.querySelectorAll('.disk');
		var offset_X = next_tower * self.options.offset_X_ratio;
		console.log('id_disk :'+ id_disk)
		var offset_Y = 0.5 * self.options.height_pole - ( self.options.height_disk * ($disks[id_disk].getAttribute('data-Ypos') - 1) );
		// vertical offset correction allows to avoid havig current disk floating in the air on arrival
		var final_offset_Y = self.options.height_disk * (-self.options.disks[next_tower].length + $disks.length - id_disk - 1);
		// updating tower clutter
		self.options.tower_clutter[next_tower] ++;

		self.animate(id_disk, offset_X, offset_Y, final_offset_Y);
		
		// update moved tower
		var id = id_disk + 1
		self.updatedisk(id, next_tower, 0);
	}

	HanoiSim.prototype.animate = function (id_disk, offset_X, offset_Y, final_offset_Y)
	{
		var $container = self.options.container;
		var $disks = $container.querySelectorAll('.disk');
		var animation_chunk = self.options.animation_duration / 3;
		var original_offset_X = parseInt($disks[id_disk].getAttribute('data-tower')) * self.options.offset_X_ratio;
		// Rising disk away from original pole
		$disks[id_disk].style.transform = "translate("+original_offset_X+",-"+offset_Y+"px)";

		// Moving disk horizontally to destination pole
		setTimeout(function ()
		{
			$disks[id_disk].style.transform = "translate("+offset_X+"vw,-"+offset_Y+"px)";
		}, animation_chunk)

		// Lowering disk to destination pole
		setTimeout(function ()
		{
			$disks[id_disk].style.transform = "translate("+offset_X+"vw,+"+final_offset_Y+"px)";

		}, animation_chunk * 2)
	}
	HanoiSim.prototype.updatedisk = function (id_disk, tower, Y_pos)
	{
		// Updates parameter of disk (vertical and horizontal position)
		var $container = self.options.container;
		var i = parseInt(id_disk);
		console.log(i)
		var $disk = document.getElementById(i);
		$disk.setAttribute('data-tower', tower);
		$disk.setAttribute('data-Ypos', Y_pos);	
		self.options.last_disk_moved = i;
	}
}());