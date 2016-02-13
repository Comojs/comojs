BEGIN { $| = 1; }
use Data::Dumper;

# print Dumper \%ENV;


print STDERR "error";

sleep 1;
# print STDOUT "Hi from perl\n";

my $i = 0;
while (<STDIN>){
	if ($_ ne "again\n"){
		die;
	}
	print STDOUT $_;
	if ($i++ > 1000){
		print STDERR "error";
		exit(0);
	}
}

exit(255);
