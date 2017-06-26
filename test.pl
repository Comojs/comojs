use strict;
use warnings;
use File::Find;
use File::Spec;
use Data::Dumper;
my $isWin = $^O =~ /win32/i;

my $start = time();

my $command = $isWin ? 'como ' : (-f './como') ? './como ' : './como.sh ';

my @tests;
my @errors;

my $testFolder = "./tests";

if (@ARGV){
	$testFolder .= "/" . $ARGV[0];
}

find(sub {
	if ($_ =~ m/\.js$/){
		my $file = $File::Find::name;
		push @tests, $file;
	}
}, $testFolder);

my $pid;
if (!$ARGV[0] || $testFolder =~ /uv/){
	$pid = fork();
	die "can't fork echo server" if $pid == -1;
	if ($pid == 0){
		my $ret = system($command . "tests/uv/echo-server.js");
		exit($ret);
	}
}

for my $test (@tests){

	if ($test =~ /echo-server\.js/){
		next;
	}

	if ($test =~ /failed/){
		next;
	}

	#ignore fixtures folder
	if ($test =~ /fixtures/){
		next;
	}

	print "Testing .. $test \n\n";
	my $ret = system($command . $test);
	print "Done Testing .. $test \n\n";
	print "===========================\n\n";
	if ($ret > 0){
		push @errors, $test;
		print "===========================\n";
	}
}

#close echo server
system($command . "tests/uv/echo-server.js --close");
my $elapsed = time() - $start;

print "Done Testing " . scalar @tests . " files in $elapsed seconds\n";

if (@errors > 0){
	print "With " . scalar @errors . " Error\n";
	foreach my $err ( @errors ){
		print "\t " . $err . "\n";
	}
	exit(1);
} else {
	print "All Tests Success\n";
}
