--[[
This program and the accompanying materials are made available under the terms of the
Eclipse Public License v2.0 which accompanies this distribution, and is available at
https://www.eclipse.org/legal/epl-v20.html

SPDX-License-Identifier: EPL-2.0

Copyright IBM Corporation 2020
--]]

debug = {{debug}}

wrk.method = {{method}}
wrk.body   = {{body}}

if debug then
  io.write("[debug]>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n")
  io.write("[debug][request] " .. wrk.method .. " " .. wrk.scheme .. "://" .. wrk.host .. ":" .. wrk.port .. wrk.path .. "\n")
  io.write("[debug][request] Headers:\n")
  for key, value in pairs(wrk.headers) do
    io.write("[debug][request]  - " .. key  .. ": " .. value .. "\n")
  end
  io.write("[debug][request] Body: " .. wrk.body .. "\n")
end

response = function (status, headers, body)
  if debug then
    io.write("[debug]<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n")
    io.write("[debug][response] Status: " .. status .. "\n")

    io.write("[debug][response] Headers:\n")

    -- Loop through passed arguments
    for key, value in pairs(headers) do
      io.write("[debug][response]  - " .. key  .. ": " .. value .. "\n")
    end

    io.write("[debug][response] Body:\n")
    io.write("[debug][response] " .. body .. "\n")
  end
end
