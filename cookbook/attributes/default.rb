#
# Cookbook Name:: turnstile
# Attribute:: default
#
# Copyright (C) 2017 Rapid7 LLC.
#
# Distributed under terms of the MIT License. All rights not explicitly granted
# in the MIT license are reserved. See the included LICENSE file for more details.
#

default['turnstile']['user'] = 'turnstile'
default['turnstile']['group'] = 'turnstile'

default['turnstile']['paths']['directory'] = '/opt/turnstile'
default['turnstile']['paths']['executable'] = ::File.join(node['turnstile']['paths']['directory'], 'bin/server')
default['turnstile']['paths']['configuration'] = '/etc/turnstile/config.json'

default['turnstile']['config'] = Mash.new
default['turnstile']['version'] = nil
default['turnstile']['install'] = :github_release
default['turnstile']['enable'] = true
