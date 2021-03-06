use strict;
use warnings;
use Data::Dumper;

use lib './scripts';
require 'helper.pl';

# my $cc = "/usr/local/musl/bin/musl-gcc";
my $cc = "gcc";

my $dll;
if ( isWin() ){
    $dll = 'duktape.dll';
} else {
    $dll = 'libduktape.so';
}

my $duksource = getFile('../libs/duktape/duktape.c');

if (!-f $duksource){
    die;
}

print Dumper $duksource;

system( $cc . ' -c -fPIC ' . $duksource) && die $!;
system( $cc . ' -shared duktape.o -o ' . $dll) && die $!;

unlink 'duktape.o';

# print Dumper $duk;
