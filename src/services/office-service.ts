/**
 * Office Service
 * Provides office location data for the /maps network page
 *
 * Features:
 * - Build-time data fetch from PostgreSQL post_office table
 * - Coordinate parsing (VARCHAR → number)
 * - Graceful error handling with fallback demo data
 * - Type-safe queries via Drizzle ORM
 */

import { db } from '@/db';
import { postOffice, infoOffice } from '@/db/schema/office';
import { eq, and } from 'drizzle-orm';

/**
 * Office location data structure for maps page
 * Matches v1 API response format with info_office data
 */
export interface OfficeLocation {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  cityName: string | null;
  districtName: string | null;
  wardName: string | null;
  lat: number | null;
  lng: number | null;
  timeWork: string | null;
  companyRepresentative: string | null;
  positionRepresentative: string | null;
}

/**
 * Parse coordinate string to number
 * Handles null, empty string, and invalid values gracefully
 */
function parseCoordinate(coord: string | null): number | null {
  if (!coord || coord.trim() === '') return null;
  const parsed = parseFloat(coord);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Fetch all active offices from database with company info
 * Filters: aactive=true AND status=2 (Approved/Đã duyệt)
 * Returns: Array of OfficeLocation sorted by name
 * Joins with info_office table to get company representative details
 *
 * Status values: 1=Chờ duyệt, 2=Đã duyệt, 3=Tạm dừng, 4=Đã hủy, 9=Đã xóa
 *
 * @returns Promise<OfficeLocation[]>
 */
export async function getActiveOffices(): Promise<OfficeLocation[]> {
  try {
    const offices = await db
      .select({
        id: postOffice.id,
        name: postOffice.name,
        address: postOffice.address,
        phone: postOffice.phone,
        cityName: postOffice.cityName,
        districtName: postOffice.districtName,
        wardName: postOffice.wardName,
        addressLatitude: postOffice.addressLatitude,
        addressLongitude: postOffice.addressLongitude,
        timeWork: postOffice.timeWork,
        companyRepresentative: infoOffice.companyRepresentative,
        positionRepresentative: infoOffice.positionRepresentative,
      })
      .from(postOffice)
      .leftJoin(infoOffice, eq(postOffice.id, infoOffice.postOfficeId))
      .where(
        and(
          eq(postOffice.aactive, true),
          eq(postOffice.status, 2) // 2 = Đã duyệt (Approved)
        )
      )
      .orderBy(postOffice.name);

    // Transform DB rows to OfficeLocation format
    return offices.map((office) => {
      let lat = parseCoordinate(office.addressLatitude);
      let lng = parseCoordinate(office.addressLongitude);

      // Fallback coordinates for VP Hà Nội if missing in database
      if (!lat && !lng && office.name === 'VP Hà Nội') {
        lat = 21.028511;
        lng = 105.804817;
      }

      return {
        id: office.id,
        name: office.name,
        address: office.address || '',
        phone: office.phone,
        cityName: office.cityName,
        districtName: office.districtName,
        wardName: office.wardName,
        lat: lat,
        lng: lng,
        timeWork: office.timeWork,
        companyRepresentative: office.companyRepresentative,
        positionRepresentative: office.positionRepresentative,
      };
    });
  } catch (error) {
    console.error('[office-service] Failed to fetch offices:', error);
    // Return fallback demo data to prevent build failure
    return getFallbackOffices();
  }
}

/**
 * Fallback demo offices for build resilience
 * Used when database is unavailable or query fails
 */
function getFallbackOffices(): OfficeLocation[] {
  console.warn('[office-service] Using fallback demo offices');
  return [
    {
      id: 1,
      name: 'Văn phòng Hà Nội',
      address: 'Tòa nhà ABC, Quận Cầu Giấy',
      phone: '024 1234 5678',
      cityName: 'Hà Nội',
      districtName: 'Cầu Giấy',
      wardName: 'Dịch Vọng',
      lat: 21.028511,
      lng: 105.804817,
      timeWork: 'Thứ 2 - Thứ 6: 8:00 - 17:30',
      companyRepresentative: 'Nguyễn Văn A',
      positionRepresentative: 'Giám đốc',
    },
    {
      id: 2,
      name: 'Văn phòng TP.HCM',
      address: 'Tòa nhà XYZ, Quận 1',
      phone: '028 9876 5432',
      cityName: 'TP. Hồ Chí Minh',
      districtName: 'Quận 1',
      wardName: 'Bến Nghé',
      lat: 10.776889,
      lng: 106.700806,
      timeWork: 'Thứ 2 - Thứ 6: 8:00 - 17:30',
      companyRepresentative: 'Trần Thị B',
      positionRepresentative: 'Giám đốc Chi nhánh',
    },
  ];
}
