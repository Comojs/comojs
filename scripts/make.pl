use strict;
use warnings;
use Data::Dumper;
use File::Spec;
use File::Copy;
use lib './scripts';
require 'helper.pl';

my %compileOptions;
my $options = '';
for (@ARGV){
	if ($_ =~ /^-D/){
		my $opt = uc($_);
		$options .= $opt . " ";
		$compileOptions{$opt} = 1;
	}
}

# my $cc = "arm-none-eabi-gcc.exe";
# my $cc = "/usr/local/musl/bin/musl-gcc";
my $cc = $ENV{CC} || "gcc";

my @files = (
	getFile("../libs/duktape/duktape.c"),
	getFile("../src/loop/core.c"),
	getFile("../libs/http/http_parser.c")
);

# if (!$compileOptions{'-DCOMO_NO_THREADS'}){
#     push @files, getFile("../libs/thread/tinycthread.c");
# }

#tls is not supported
my $mbedFolder = '../libs/mbedtls/';
if (!$compileOptions{'-DCOMO_NO_TLS'}){
	opendir(DIR, getFile( $mbedFolder . 'library')) or die $!;
	while (my $file = readdir(DIR)) {
		next if ($file eq "." || $file eq ".." || $file eq "mbedtls");
		my $f = getFile( $mbedFolder . 'library/' . $file);
		push @files, $f;
	}
} else {
	#if no tls support we still need some crypto & hashing
	push @files, getFile($mbedFolder . "library/md5.c");
	push @files, getFile($mbedFolder . "library/sha1.c");
	push @files, getFile($mbedFolder . "library/sha256.c");
	push @files, getFile($mbedFolder . "library/sha512.c");
}

my $build = join ' ', @files;

my $buildStr = "$cc -Wall -Werror -Wno-missing-braces -Wno-trigraphs -Wno-unused-value"
			 . " -I./libs"
			 . " -I./libs/mbedtls/library"
			 . " -L."
			 . ($options ? " " . $options : "")
			 . " " . $build
			 . " -std=gnu99 -o como" . (isWin() ? ".exe" : "");

			$buildStr .= " src/main.c";

			if (isWin()){
				$buildStr .= " -lws2_32";
			} else {
				$buildStr .= " -lrt -lpthread -lm -ldl";
			}

system($buildStr) && die $!;

1;
