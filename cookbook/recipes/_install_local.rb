#
# Cookbook Name:: turnstile
# Recipe:: _install_local
#
# Copyright (C) 2017 Rapid7 LLC.
#
# Distributed under terms of the MIT License. All rights not explicitly granted
# in the MIT license are reserved. See the included LICENSE file for more details.
#

Chef::Application.fatal!(
  "Mount the Turnstile application at #{node['turnstile']['paths']['directory']}"
) unless ::Dir.exist?(node['turnstile']['paths']['directory'])

## node-libuuid support
package 'build-essential'
package 'uuid-dev'

execute 'npm install' do
  command '/usr/bin/npm install'
  cwd node['turnstile']['paths']['directory']
  environment 'HOME' => node['turnstile']['paths']['directory']
end
