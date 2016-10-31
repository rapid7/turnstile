#
# Cookbook Name:: turnstile
# Recipe:: default
#
# Copyright (C) 2016 Rapid7 LLC.
#
# Distributed under terms of the MIT License. All rights not explicitly granted
# in the MIT license are reserved. See the included LICENSE file for more details.
#

#######################
## Install NodeJS 4.x
#
##
include_recipe 'apt::default'

apt_repository 'nodejs-4x' do
  uri 'https://deb.nodesource.com/node_4.x'
  distribution node['lsb']['codename']
  components ['main']
  key 'https://deb.nodesource.com/gpgkey/nodesource.gpg.key'
end

package 'nodejs'
#######################

node.default['turnstile']['version'] = cookbook_version

group node['turnstile']['group'] do
  system true
end

user node['turnstile']['user'] do
  comment 'turnstile operator'
  system true

  gid node['turnstile']['group']
  home node['turnstile']['paths']['directory']
end

case node['turnstile']['install'].to_sym
when :github_release then include_recipe "#{cookbook_name}::_install_github_release"
when :github_ref then include_recipe "#{cookbook_name}::_install_github_ref"
when :local then include_recipe "#{cookbook_name}::_install_local"
else Chef::Application.fatal!("Unhanded Turnstile installation method #{node['turnstile']['install']}")
end

## Upstart Service
template '/etc/init/turnstile.conf' do
  source 'upstart.conf.erb'
  variables(
    :description => 'turnstile configuration service',
    :user => node['turnstile']['user'],
    :executable => node['turnstile']['paths']['executable'],
    :flags => [
      "-c #{node['turnstile']['paths']['configuration']}"
    ]
  )

  notifies :restart, 'service[turnstile]' if node['turnstile']['enable']
end

directory 'turnstile-configuration-directory' do
  path ::File.dirname(node['turnstile']['paths']['configuration'])
  mode '0755'

  recursive true
end

template 'turnstile-configuration' do
  path node['turnstile']['paths']['configuration']
  source 'json.erb'

  variables :properties => node['turnstile']['config']

  notifies :restart, 'service[turnstile]' if node['turnstile']['enable']
end

service 'turnstile' do
  action node['turnstile']['enable'] ? [:start, :enable] : [:stop, :disable]
  provider Chef::Provider::Service::Upstart
end
